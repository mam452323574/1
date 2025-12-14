import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const MAX_ATTEMPTS = 5;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { code, userId, type = 'signup' } = await req.json();

    if (!code || !userId) throw new Error('Missing data');

    // Récupérer le code valide
    const { data: verificationCode, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !verificationCode) {
      return new Response(JSON.stringify({ error: 'Code invalide ou expiré' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Vérifications
    if (new Date(verificationCode.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Code expiré' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (verificationCode.attempts_count >= MAX_ATTEMPTS) {
      return new Response(JSON.stringify({ error: 'Trop de tentatives' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Code incorrect
    if (verificationCode.code !== code) {
      await supabase.from('verification_codes').update({ attempts_count: verificationCode.attempts_count + 1 }).eq('id', verificationCode.id);
      return new Response(JSON.stringify({ error: 'Code incorrect' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Code correct ! On valide.
    await supabase.from('verification_codes').update({ verified_at: new Date().toISOString() }).eq('id', verificationCode.id);
    await supabase.from('user_profiles').update({ email_verified: true }).eq('id', userId);

    return new Response(JSON.stringify({ success: true, verified: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
