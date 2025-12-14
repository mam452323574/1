import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
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
  const title = type === 'signup' ? 'Bienvenue sur Health Scan' : 'Connexion a Health Scan';
  const subtitle = type === 'signup'
    ? 'Verifiez votre adresse email pour finaliser votre inscription.'
    : 'Un code de verification a ete demande pour votre connexion.';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #E53935 0%, #FF5252 100%); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 28px;">&#9829;</span>
              </div>
              <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">${title}</h1>
              <p style="margin: 0; font-size: 16px; color: #666666;">${subtitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center;">
                <p style="margin: 0 0 15px 0; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Votre code de verification</p>
                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #E53935; font-family: 'Courier New', monospace;">${code}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                Ce code expire dans <strong>15 minutes</strong>.
              </p>
              <p style="margin: 0; font-size: 14px; color: #999999;">
                Si vous n'avez pas demande ce code, ignorez cet email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
                Health Scan - Votre sante, notre priorite
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, userId, type = 'signup' }: VerificationRequest = await req.json();

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: 'Email and userId are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { count } = await supabase
      .from('verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', type)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (count && count >= 5) {
      return new Response(
        JSON.stringify({ error: 'Trop de tentatives. Veuillez attendre avant de demander un nouveau code.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await supabase.rpc('invalidate_previous_codes', { p_user_id: userId, p_type: type });

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

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const { error: emailError } = await resend.emails.send({
          from: 'Health Scan <noreply@healthscan.app>',
          to: email,
          subject: type === 'signup' ? 'Verifiez votre email - Health Scan' : 'Code de connexion - Health Scan',
          html: generateEmailTemplate(code, type),
        });

        if (emailError) {
          console.error('Resend error:', emailError);
          return new Response(
            JSON.stringify({ error: 'Failed to send verification email' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        console.log(`Verification email sent to ${email}`);
      } catch (emailErr) {
        console.error('Email sending error:', emailErr);
        return new Response(
          JSON.stringify({ error: 'Failed to send verification email' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      console.log(`[DEV MODE] Verification code for ${email}: ${code}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Code de verification envoye',
        expiresAt: expiresAt.toISOString(),
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
