import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface VerifyRequest {
  code: string;
  userId: string;
  type?: 'signup' | 'login';
}

const MAX_ATTEMPTS = 5;

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

    const { code, userId, type = 'signup' }: VerifyRequest = await req.json();

    if (!code || !userId) {
      return new Response(
        JSON.stringify({ error: 'Code et userId requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: 'Format de code invalide' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: verificationCode, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Database error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la verification' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!verificationCode) {
      return new Response(
        JSON.stringify({ error: 'Aucun code de verification en attente' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (new Date(verificationCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Code expire. Veuillez demander un nouveau code.' }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (verificationCode.attempts_count >= MAX_ATTEMPTS) {
      return new Response(
        JSON.stringify({ error: 'Trop de tentatives. Veuillez demander un nouveau code.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (verificationCode.code !== code) {
      await supabase
        .from('verification_codes')
        .update({ attempts_count: verificationCode.attempts_count + 1 })
        .eq('id', verificationCode.id);

      const remainingAttempts = MAX_ATTEMPTS - verificationCode.attempts_count - 1;
      return new Response(
        JSON.stringify({
          error: `Code incorrect. ${remainingAttempts} tentative(s) restante(s).`,
          remainingAttempts,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verificationCode.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la validation' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ email_verified: true })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    console.log(`Email verified for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email verifie avec succes',
        verified: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
