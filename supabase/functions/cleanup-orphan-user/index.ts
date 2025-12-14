import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Attention : on utilise le Service Role ici pour avoir le droit de supprimer des users
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { userId } = await req.json();
    if (!userId) throw new Error('UserId required');

    // Vérifier si déjà vérifié pour ne pas supprimer par erreur
    const { data: profile } = await supabase.from('user_profiles').select('email_verified').eq('id', userId).maybeSingle();

    if (profile?.email_verified) {
      return new Response(JSON.stringify({ error: 'User already verified' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Suppression en cascade
    await supabase.from('verification_codes').delete().eq('user_id', userId);
    await supabase.from('trusted_devices').delete().eq('user_id', userId);
    await supabase.from('user_profiles').delete().eq('id', userId);

    // Suppression Auth finale
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to cleanup' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
