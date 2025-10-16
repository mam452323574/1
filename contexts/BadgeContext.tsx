import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface BadgeState {
  analytics: boolean;
  recipes: boolean;
  exercises: boolean;
}

interface BadgeContextType {
  badges: BadgeState;
  clearBadge: (tab: keyof BadgeState) => void;
  setBadge: (tab: keyof BadgeState) => void;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

const BADGE_STORAGE_KEY = 'healthscan_badges';

export function BadgeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeState>({
    analytics: false,
    recipes: false,
    exercises: false,
  });
  const [lastCheckedRecipes, setLastCheckedRecipes] = useState<string | null>(null);
  const [lastCheckedExercises, setLastCheckedExercises] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    loadBadgeState();
    checkForNewContent();

    const subscription = supabase
      .channel('content_updates_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'content_updates',
        },
        (payload: any) => {
          if (payload.new.content_type === 'recipe') {
            setBadges((prev) => ({ ...prev, recipes: true }));
          } else if (payload.new.content_type === 'exercise') {
            setBadges((prev) => ({ ...prev, exercises: true }));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    saveBadgeState();
  }, [badges]);

  const loadBadgeState = async () => {
    try {
      const stored = await AsyncStorage.getItem(BADGE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBadges(parsed.badges || badges);
        setLastCheckedRecipes(parsed.lastCheckedRecipes || null);
        setLastCheckedExercises(parsed.lastCheckedExercises || null);
      }
    } catch (error) {
      console.error('Error loading badge state:', error);
    }
  };

  const saveBadgeState = async () => {
    try {
      const state = {
        badges,
        lastCheckedRecipes,
        lastCheckedExercises,
      };
      await AsyncStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving badge state:', error);
    }
  };

  const checkForNewContent = async () => {
    if (!user) return;

    const now = new Date().toISOString();

    const { data: recipeUpdates } = await supabase
      .from('content_updates')
      .select('created_at')
      .eq('content_type', 'recipe')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recipeUpdates && (!lastCheckedRecipes || recipeUpdates.created_at > lastCheckedRecipes)) {
      setBadges((prev) => ({ ...prev, recipes: true }));
    }

    const { data: exerciseUpdates } = await supabase
      .from('content_updates')
      .select('created_at')
      .eq('content_type', 'exercise')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (exerciseUpdates && (!lastCheckedExercises || exerciseUpdates.created_at > lastCheckedExercises)) {
      setBadges((prev) => ({ ...prev, exercises: true }));
    }
  };

  const clearBadge = (tab: keyof BadgeState) => {
    setBadges((prev) => ({ ...prev, [tab]: false }));

    if (tab === 'recipes') {
      setLastCheckedRecipes(new Date().toISOString());
    } else if (tab === 'exercises') {
      setLastCheckedExercises(new Date().toISOString());
    }
  };

  const setBadge = (tab: keyof BadgeState) => {
    setBadges((prev) => ({ ...prev, [tab]: true }));
  };

  return (
    <BadgeContext.Provider value={{ badges, clearBadge, setBadge }}>
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadges() {
  const context = useContext(BadgeContext);
  if (context === undefined) {
    throw new Error('useBadges must be used within a BadgeProvider');
  }
  return context;
}
