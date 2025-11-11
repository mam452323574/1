import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { SCAN_LIMITS, ScanType, AccountTier } from '../_shared/scan-limits.ts';

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

Deno.serve(async (req: Request) => {
  console.log('[sync-scan-limits] Function started');

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log('[sync-scan-limits] User authenticated:', user.id);

    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('account_tier')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('Failed to fetch user profile');
    }

    const accountTier = profile.account_tier as AccountTier;
    console.log('[sync-scan-limits] Account tier:', accountTier);

    const scanTypes: ScanType[] = ['health', 'body', 'nutrition'];
    const syncedUsage: ScanUsage = {
      health: { last_scan_date: null, scan_timestamps: [] },
      body: { last_scan_date: null, scan_timestamps: [] },
      nutrition: { last_scan_date: null, scan_timestamps: [] },
    };

    const now = Date.now();

    for (const scanType of scanTypes) {
      const limit = SCAN_LIMITS[accountTier][scanType];
      const cutoffTime = new Date(now - limit.periodMs).toISOString();

      console.log(`[sync-scan-limits] Syncing ${scanType} scans since ${cutoffTime}`);

      const { data: scans, error: scansError } = await supabaseClient
        .from('scans')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('scan_type', scanType)
        .gte('created_at', cutoffTime)
        .order('created_at', { ascending: true });

      if (scansError) {
        console.error(`[sync-scan-limits] Error fetching ${scanType} scans:`, scansError);
        continue;
      }

      if (scans && scans.length > 0) {
        const timestamps = scans.map(scan => scan.created_at);
        syncedUsage[scanType] = {
          last_scan_date: timestamps[timestamps.length - 1],
          scan_timestamps: timestamps.slice(-limit.count),
        };
        console.log(`[sync-scan-limits] Found ${scans.length} ${scanType} scans in period`);
      } else {
        console.log(`[sync-scan-limits] No ${scanType} scans found in period`);
      }
    }

    console.log('[sync-scan-limits] Updating user profile with synced data...');

    const { error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({ scan_usage: syncedUsage })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    console.log('[sync-scan-limits] Successfully synced scan limits');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scan limits synchronized',
        scan_usage: syncedUsage,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[sync-scan-limits] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
