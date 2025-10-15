import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ScanCheckRequest {
  scanType: 'body' | 'health' | 'nutrition';
}

interface ScanUsageRecord {
  last_scan_date: string | null;
  scan_timestamps: string[];
}

interface ScanUsage {
  health: ScanUsageRecord;
  body: ScanUsageRecord;
  nutrition: ScanUsageRecord;
}

const SCAN_LIMITS = {
  free: {
    health: { count: 1, periodMs: 7 * 24 * 60 * 60 * 1000 },
    body: { count: 1, periodMs: 30 * 24 * 60 * 60 * 1000 },
    nutrition: { count: 1, periodMs: 3 * 24 * 60 * 60 * 1000 },
  },
  premium: {
    health: { count: 3, periodMs: 24 * 60 * 60 * 1000 },
    body: { count: 3, periodMs: 24 * 60 * 60 * 1000 },
    nutrition: { count: 3, periodMs: 24 * 60 * 60 * 1000 },
  },
};

const SCAN_MESSAGES = {
  free: {
    health: 'Limite hebdomadaire atteinte. Prochain scan disponible dans',
    body: 'Limite mensuelle atteinte. Prochain scan disponible dans',
    nutrition: 'Limite atteinte. Prochain scan disponible dans',
  },
  premium: {
    health: 'Limite quotidienne atteinte (3 scans). Prochain scan disponible dans',
    body: 'Limite quotidienne atteinte (3 scans). Prochain scan disponible dans',
    nutrition: 'Limite quotidienne atteinte (3 scans). Prochain scan disponible dans',
  },
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { scanType }: ScanCheckRequest = await req.json();

    if (!scanType || !['body', 'health', 'nutrition'].includes(scanType)) {
      throw new Error('Invalid scan type');
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('account_tier, scan_usage')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('Failed to fetch user profile');
    }

    const accountTier = profile.account_tier as 'free' | 'premium';
    const scanUsage: ScanUsage = profile.scan_usage || {
      health: { last_scan_date: null, scan_timestamps: [] },
      body: { last_scan_date: null, scan_timestamps: [] },
      nutrition: { last_scan_date: null, scan_timestamps: [] },
    };

    const limit = SCAN_LIMITS[accountTier][scanType];
    const now = Date.now();
    const cutoffTime = now - limit.periodMs;

    const record = scanUsage[scanType];
    const validTimestamps = (record.scan_timestamps || [])
      .filter((ts: string) => new Date(ts).getTime() > cutoffTime);

    if (validTimestamps.length >= limit.count) {
      const oldestTimestamp = validTimestamps.sort()[0];
      const nextAvailableDate = new Date(oldestTimestamp).getTime() + limit.periodMs;

      return new Response(
        JSON.stringify({
          success: true,
          allowed: false,
          message: SCAN_MESSAGES[accountTier][scanType],
          next_available_date: nextAvailableDate,
          current_count: validTimestamps.length,
          limit: limit.count,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const nowIso = new Date(now).toISOString();
    validTimestamps.push(nowIso);

    const updatedScanUsage = {
      ...scanUsage,
      [scanType]: {
        last_scan_date: nowIso,
        scan_timestamps: validTimestamps.slice(-limit.count),
      },
    };

    const { error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({ scan_usage: updatedScanUsage })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        allowed: true,
        message: 'Scan autorisé',
        current_count: validTimestamps.length,
        limit: limit.count,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error checking scan eligibility:', error);
    return new Response(
      JSON.stringify({
        success: false,
        allowed: false,
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
