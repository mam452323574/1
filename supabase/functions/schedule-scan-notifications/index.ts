import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ScanUsageRecord {
  last_scan_date: string | null;
  scan_timestamps: string[];
}

interface ScanUsage {
  health: ScanUsageRecord;
  body: ScanUsageRecord;
  nutrition: ScanUsageRecord;
}

interface UserProfile {
  id: string;
  username: string;
  push_token: string | null;
  account_tier: 'free' | 'premium';
  scan_usage: ScanUsage;
  notification_settings: {
    reminders: boolean;
    achievements: boolean;
    newContent: boolean;
  };
}

const SCAN_LIMITS = {
  health: { periodMs: 7 * 24 * 60 * 60 * 1000, name: 'scan santé hebdomadaire' },
  body: { periodMs: 30 * 24 * 60 * 60 * 1000, name: 'scan corps mensuel' },
  nutrition: { periodMs: 3 * 24 * 60 * 60 * 1000, name: 'scan nutrition' },
};

const NOTIFICATION_TITLES = {
  health: 'Scan Santé Disponible',
  body: 'Scan Corps Disponible',
  nutrition: 'Scan Nutrition Disponible',
};

const NOTIFICATION_BODIES = {
  health: 'Votre scan santé hebdomadaire est maintenant disponible. Prenez soin de vous !',
  body: 'Votre scan corps mensuel est maintenant disponible. Suivez votre progression !',
  nutrition: 'Votre scan nutrition est maintenant disponible. Analysez vos repas !',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: users, error: usersError } = await supabaseClient
      .from('user_profiles')
      .select('id, username, push_token, account_tier, scan_usage, notification_settings')
      .eq('account_tier', 'free')
      .not('push_token', 'is', null);

    if (usersError) {
      throw usersError;
    }

    const now = Date.now();
    const notificationsToSend: Array<{
      userId: string;
      username: string;
      token: string;
      scanType: 'health' | 'body' | 'nutrition';
    }> = [];

    for (const user of users as UserProfile[]) {
      if (!user.notification_settings?.reminders) {
        continue;
      }

      if (!user.push_token) {
        continue;
      }

      const scanUsage = user.scan_usage || {
        health: { last_scan_date: null, scan_timestamps: [] },
        body: { last_scan_date: null, scan_timestamps: [] },
        nutrition: { last_scan_date: null, scan_timestamps: [] },
      };

      for (const scanType of ['health', 'body', 'nutrition'] as const) {
        const record = scanUsage[scanType];
        const lastScanDate = record?.last_scan_date;

        if (!lastScanDate) {
          notificationsToSend.push({
            userId: user.id,
            username: user.username,
            token: user.push_token,
            scanType,
          });
          continue;
        }

        const lastScanTime = new Date(lastScanDate).getTime();
        const timeSinceLastScan = now - lastScanTime;
        const limit = SCAN_LIMITS[scanType];

        if (timeSinceLastScan >= limit.periodMs) {
          notificationsToSend.push({
            userId: user.id,
            username: user.username,
            token: user.push_token,
            scanType,
          });
        }
      }
    }

    const notifications = notificationsToSend.map((notif) => ({
      to: notif.token,
      title: NOTIFICATION_TITLES[notif.scanType],
      body: NOTIFICATION_BODIES[notif.scanType],
      data: {
        type: 'scan_available',
        scanType: notif.scanType,
        userId: notif.userId,
      },
    }));

    let sentCount = 0;
    for (const notification of notifications) {
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notification),
        });

        if (response.ok) {
          sentCount++;
        }
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${users.length} free users, sent ${sentCount} notifications`,
        notifications_sent: sentCount,
        users_checked: users.length,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error scheduling scan notifications:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
