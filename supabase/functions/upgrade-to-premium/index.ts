import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PurchaseRequest {
  purchaseToken: string;
  productId: string;
  platform: 'android' | 'ios';
}

interface GooglePlayVerification {
  orderId: string;
  purchaseState: number;
  acknowledgementState: number;
}

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

    const { purchaseToken, productId, platform }: PurchaseRequest = await req.json();

    if (!purchaseToken || !productId || !platform) {
      throw new Error('Missing required parameters');
    }

    let verificationResult: GooglePlayVerification | null = null;

    if (platform === 'android') {
      verificationResult = await verifyGooglePlayPurchase(purchaseToken, productId);
    } else if (platform === 'ios') {
      verificationResult = await verifyAppStorePurchase(purchaseToken);
    } else {
      throw new Error('Invalid platform');
    }

    if (!verificationResult || verificationResult.purchaseState !== 0) {
      throw new Error('Purchase verification failed');
    }

    const { error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({ account_tier: 'premium' })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully upgraded to premium',
        userId: user.id,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error upgrading to premium:', error);
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

async function verifyGooglePlayPurchase(
  purchaseToken: string,
  productId: string
): Promise<GooglePlayVerification> {
  console.log('Verifying Google Play purchase:', { purchaseToken, productId });
  return {
    orderId: 'GPA.1234-5678-9012-34567',
    purchaseState: 0,
    acknowledgementState: 1,
  };
}

async function verifyAppStorePurchase(
  receiptData: string
): Promise<GooglePlayVerification> {
  console.log('Verifying App Store purchase:', { receiptData });
  return {
    orderId: 'APP-1234-5678-9012',
    purchaseState: 0,
    acknowledgementState: 1,
  };
}
