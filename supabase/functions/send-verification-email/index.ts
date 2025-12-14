import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface VerificationRequest {
  email: string;
  userId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, userId }: VerificationRequest = await req.json();

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: 'Email and userId are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Store verification code in database
    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert({
        user_id: userId,
        email,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to create verification code' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // In production, you would send this via email service (SendGrid, Resend, etc.)
    // For now, we'll return it in the response (only for development)
    console.log(`Verification code for ${email}: ${code}`);

    // TODO: Integrate with email service provider
    // Example with Resend:
    // const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    // await resend.emails.send({
    //   from: 'noreply@healthscan.app',
    //   to: email,
    //   subject: 'Your HealthScan Verification Code',
    //   html: `Your verification code is: <strong>${code}</strong>. It expires in 15 minutes.`,
    // });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code sent',
        // Remove this in production!
        devCode: code,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
