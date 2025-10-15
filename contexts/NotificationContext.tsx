import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationContextType {
  hasUnreadNotifications: boolean;
  notificationCount: number;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  checkForAchievements: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { expoPushToken, scheduleLocalNotification } = useNotifications();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    fetchUnreadNotifications();

    const subscription = supabase
      .channel('notification_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchUnreadNotifications = async () => {
    if (!user) return;

    const { count, error } = await supabase
      .from('notification_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (!error && count !== null) {
      setNotificationCount(count);
      setHasUnreadNotifications(count > 0);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('notification_logs')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (!error) {
      fetchUnreadNotifications();
    }
  };

  const checkForAchievements = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('account_created_at, last_scan_date')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    const accountAge = profile.account_created_at
      ? Date.now() - new Date(profile.account_created_at).getTime()
      : 0;

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
    const threeMonthsMs = 90 * 24 * 60 * 60 * 1000;
    const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;

    const achievements = [
      { type: 'one_week', threshold: oneWeekMs, message: 'Félicitations ! Une semaine de suivi santé !' },
      { type: 'one_month', threshold: oneMonthMs, message: 'Félicitations ! 🎉 Cela fait un mois que vous prenez soin de vous avec Health Scan.' },
      { type: 'three_months', threshold: threeMonthsMs, message: 'Bravo ! 3 mois de suivi santé !' },
      { type: 'six_months', threshold: sixMonthsMs, message: 'Incroyable ! 6 mois de suivi de votre santé. Continuez comme ça !' },
      { type: 'one_year', threshold: oneYearMs, message: 'Extraordinaire ! Un an avec Health Scan ! 🏆' },
    ];

    for (const achievement of achievements) {
      if (accountAge >= achievement.threshold) {
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

          await supabase.from('notification_logs').insert({
            user_id: user.id,
            notification_type: 'achievement',
            title: 'Nouveau Jalon !',
            body: achievement.message,
          });

          if (scheduleLocalNotification) {
            await scheduleLocalNotification('Nouveau Jalon !', achievement.message, {
              type: 'achievement',
              achievementType: achievement.type,
            });
          }
        }
      }
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        hasUnreadNotifications,
        notificationCount,
        markNotificationAsRead,
        checkForAchievements,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
