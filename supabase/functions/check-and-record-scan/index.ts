import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const BYPASS_PREMIUM_LIMITS = true;

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
    health: 'Limite hebdomadaire atteinte',
    body: 'Limite mensuelle atteinte',
    nutrition: 'Limite atteinte',
  },
  premium: {
    health: 'Limite quotidienne atteinte (3 scans)',
    body: 'Limite quotidienne atteinte (3 scans)',
    nutrition: 'Limite quotidienne atteinte (3 scans)',
  },
};

function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} jour${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} heure${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
  }
}

function formatAbsoluteDate(timestamp: number): string {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleString('fr-FR', options);
}

Deno.serve(async (req: Request) => {
  console.log('[Edge Function] ========================================');
  console.log('[Edge Function] check-and-record-scan STARTED');
  console.log('[Edge Function] Method:', req.method);
  console.log('[Edge Function] BYPASS_PREMIUM_LIMITS:', BYPASS_PREMIUM_LIMITS);

  if (req.method === 'OPTIONS') {
    console.log('[Edge Function] OPTIONS request - returning CORS headers');
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('[Edge Function] Creating Supabase client...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('[Edge Function] ✓ Supabase client created');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[Edge Function] ERROR: Missing authorization header');
      throw new Error('Missing authorization header');
    }
    console.log('[Edge Function] ✓ Authorization header found');

    const token = authHeader.replace('Bearer ', '');
    console.log('[Edge Function] Authenticating user...');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('[Edge Function] ERROR: Authentication failed:', authError);
      throw new Error('Invalid authentication');
    }
    console.log('[Edge Function] ✓ User authenticated. User ID:', user.id);

    console.log('[Edge Function] Parsing request body...');
    const { scanType }: ScanCheckRequest = await req.json();
    console.log('[Edge Function] ✓ Request body parsed. Scan type:', scanType);

    if (!scanType || !['body', 'health', 'nutrition'].includes(scanType)) {
      console.error('[Edge Function] ERROR: Invalid scan type:', scanType);
      throw new Error('Invalid scan type');
    }

    console.log('[Edge Function] Fetching user profile...');
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('account_tier, scan_usage')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('[Edge Function] ERROR: Failed to fetch user profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }
    console.log('[Edge Function] ✓ User profile fetched');
    console.log('[Edge Function] Account tier:', profile.account_tier);

    const accountTier = profile.account_tier as 'free' | 'premium';
    const scanUsage: ScanUsage = profile.scan_usage || {
      health: { last_scan_date: null, scan_timestamps: [] },
      body: { last_scan_date: null, scan_timestamps: [] },
      nutrition: { last_scan_date: null, scan_timestamps: [] },
    };
    console.log('[Edge Function] Current scan usage:', JSON.stringify(scanUsage[scanType]));

    const limit = SCAN_LIMITS[accountTier][scanType];
    console.log('[Edge Function] Limit for', scanType, ':', limit.count, 'scans per', limit.periodMs / (24 * 60 * 60 * 1000), 'days');

    const now = Date.now();
    const cutoffTime = now - limit.periodMs;
    console.log('[Edge Function] Current time:', new Date(now).toISOString());
    console.log('[Edge Function] Cutoff time:', new Date(cutoffTime).toISOString());

    const record = scanUsage[scanType];
    const validTimestamps = (record.scan_timestamps || [])
      .filter((ts: string) => new Date(ts).getTime() > cutoffTime);
    console.log('[Edge Function] Valid timestamps within period:', validTimestamps.length);
    console.log('[Edge Function] All timestamps:', record.scan_timestamps);

    console.log('[Edge Function] Checking limit... BYPASS_PREMIUM_LIMITS =', BYPASS_PREMIUM_LIMITS);
    if (!BYPASS_PREMIUM_LIMITS && validTimestamps.length >= limit.count) {
      console.log('[Edge Function] LIMIT REACHED - denying scan');
      const oldestTimestamp = validTimestamps.sort()[0];
      const nextAvailableDate = new Date(oldestTimestamp).getTime() + limit.periodMs;
      const timeRemaining = nextAvailableDate - now;
      const formattedTime = formatTimeRemaining(timeRemaining);
      const absoluteDate = formatAbsoluteDate(nextAvailableDate);

      const message = `${SCAN_MESSAGES[accountTier][scanType]}. Prochain scan disponible le ${absoluteDate} (dans ${formattedTime}).`;

      return new Response(
        JSON.stringify({
          success: true,
          allowed: false,
          message: message,
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

    console.log('[Edge Function] Limit NOT reached or BYPASS enabled - allowing scan');
    console.log('[Edge Function] Recording scan timestamp...');

    const nowIso = new Date(now).toISOString();
    validTimestamps.push(nowIso);
    console.log('[Edge Function] New timestamp added:', nowIso);
    console.log('[Edge Function] Total valid timestamps after adding:', validTimestamps.length);

    const updatedScanUsage = {
      ...scanUsage,
      [scanType]: {
        last_scan_date: nowIso,
        scan_timestamps: validTimestamps.slice(-limit.count),
      },
    };
    console.log('[Edge Function] Updated scan usage for', scanType, ':', JSON.stringify(updatedScanUsage[scanType]));

    console.log('[Edge Function] Updating user profile in database...');
    const { error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({ scan_usage: updatedScanUsage })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Edge Function] ERROR: Failed to update user profile:', updateError);
      throw updateError;
    }
    console.log('[Edge Function] ✓ User profile updated successfully');

    const responseData = {
      success: true,
      allowed: true,
      message: 'Scan autorisé',
      current_count: validTimestamps.length,
      limit: limit.count,
    };
    console.log('[Edge Function] Returning success response:', JSON.stringify(responseData));
    console.log('[Edge Function] ========================================');

    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[Edge Function] ========================================');
    console.error('[Edge Function] ERROR occurred');
    console.error('[Edge Function] Error:', error);
    console.error('[Edge Function] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    if (error instanceof Error) {
      console.error('[Edge Function] Error message:', error.message);
      console.error('[Edge Function] Error stack:', error.stack);
    }
    console.error('[Edge Function] ========================================');

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
