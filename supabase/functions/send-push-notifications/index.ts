import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PushNotification {
  to: string;
  title: string;
  body: string;
  data?: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'check-inactive-users') {
      return await checkInactiveUsers(supabase);
    } else if (action === 'check-achievements') {
      return await checkAchievements(supabase);
    } else if (action === 'send-custom') {
      const { userId, title, body, data } = await req.json();
      return await sendCustomNotification(supabase, userId, title, body, data);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function checkInactiveUsers(supabase: any) {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data: inactiveUsers, error } = await supabase
    .from('user_profiles')
    .select('id, push_token, notification_settings')
    .not('push_token', 'is', null)
    .or(`last_scan_date.is.null,last_scan_date.lt.${threeDaysAgo.toISOString()}`);

  if (error) throw error;

  const notificationsSent = [];

  for (const user of inactiveUsers || []) {
    const settings = user.notification_settings || {};
    if (settings.reminders === false) continue;

    const { data: recentLog } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('notification_type', 'reminder')
      .gte('sent_at', threeDaysAgo.toISOString())
      .maybeSingle();

    if (recentLog) continue;

    const title = 'Health Scan';
    const body = 'Il est temps de faire le point sur votre santé ! Faites un nouveau scan.';

    await sendPushNotification(user.push_token, title, body, {
      type: 'reminder',
    });

    await supabase.from('notification_logs').insert({
      user_id: user.id,
      notification_type: 'reminder',
      title,
      body,
    });

    notificationsSent.push(user.id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      notificationsSent: notificationsSent.length,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function checkAchievements(supabase: any) {
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, push_token, account_created_at, notification_settings')
    .not('push_token', 'is', null);

  if (error) throw error;

  const notificationsSent = [];
  const now = Date.now();

  const achievements = [
    { type: 'one_week', days: 7, message: 'Félicitations ! Une semaine de suivi santé !' },
    { type: 'one_month', days: 30, message: 'Félicitations ! 🎉 Cela fait un mois que vous prenez soin de vous avec Health Scan.' },
    { type: 'three_months', days: 90, message: 'Bravo ! 3 mois de suivi santé !' },
    { type: 'six_months', days: 180, message: 'Incroyable ! 6 mois de suivi de votre santé. Continuez comme ça !' },
    { type: 'one_year', days: 365, message: 'Extraordinaire ! Un an avec Health Scan ! 🏆' },
  ];

  for (const user of users || []) {
    const settings = user.notification_settings || {};
    if (settings.achievements === false) continue;

    const accountAge = user.account_created_at
      ? now - new Date(user.account_created_at).getTime()
      : 0;
    const accountAgeDays = accountAge / (24 * 60 * 60 * 1000);

    for (const achievement of achievements) {
      if (accountAgeDays >= achievement.days && accountAgeDays < achievement.days + 1) {
        const { data: existing } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', user.id)
          .eq('achievement_type', achievement.type)
          .maybeSingle();

        if (!existing) {
          await supabase.from('user_achievements').insert({
            user_id: user.id,
            achievement_type: achievement.type,
          });

          const title = 'Nouveau Jalon !';
          const body = achievement.message;

          await sendPushNotification(user.push_token, title, body, {
            type: 'achievement',
            achievementType: achievement.type,
          });

          await supabase.from('notification_logs').insert({
            user_id: user.id,
            notification_type: 'achievement',
            title,
            body,
          });

          notificationsSent.push(user.id);
        }
      }
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      notificationsSent: notificationsSent.length,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function sendCustomNotification(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  data?: any
) {
  const { data: user } = await supabase
    .from('user_profiles')
    .select('push_token')
    .eq('id', userId)
    .single();

  if (!user?.push_token) {
    throw new Error('User has no push token');
  }

  await sendPushNotification(user.push_token, title, body, data);

  await supabase.from('notification_logs').insert({
    user_id: userId,
    notification_type: 'new_content',
    title,
    body,
  });

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: any
) {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Failed to send push notification: ${response.statusText}`);
  }

  return response.json();
}