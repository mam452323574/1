import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface VerificationRequest {
  email: string;
  userId: string;
  type?: 'signup' | 'login';
}

function generateEmailTemplate(code: string, type: 'signup' | 'login'): string {
  const title = type === 'signup' ? 'Bienvenue sur Health Scan' : 'Connexion à Health Scan';
  const subtitle = type === 'signup'
    ? 'Vérifiez votre adresse email pour finaliser votre inscription.'
    : 'Un code de vérification a été demandé pour votre connexion.';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head>
  <body style="font-family: sans-serif; background-color: #f5f5f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px;">
      <h1 style="color: #1a1a1a;">${title}</h1>
      <p style="color: #666;">${subtitle}</p>
      <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #E53935;">${code}</span>
      </div>
      <p style="font-size: 12px; color: #999;">Expire dans 15 minutes.</p>
    </div>
  </body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email, userId, type = 'signup' }: VerificationRequest = await req.json();

    if (!email || !userId) {
      return new Response(JSON.stringify({ error: 'Email and userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Vérifier limite (Rate limiting)
    const { count } = await supabase
      .from('verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', type)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (count && count >= 5) {
      return new Response(JSON.stringify({ error: 'Trop de tentatives. Attendez 1h.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Invalider les anciens codes
    await supabase.rpc('invalidate_previous_codes', { p_user_id: userId, p_type: type });

    // Créer nouveau code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert({
        user_id: userId,
        email,
        code,
        type,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) throw dbError;

    // Envoyer Email
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: 'Health Scan <onboarding@resend.dev>', // Change ça par ton domaine vérifié si tu en as un
        to: email,
        subject: type === 'signup' ? 'Vérifiez votre email' : 'Code de connexion',
        html: generateEmailTemplate(code, type),
      });
    } else {
      console.log(`[DEV] Code pour ${email}: ${code}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Envoyé' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
