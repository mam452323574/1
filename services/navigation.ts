import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

class NavigationService {
  private isNavigating = false;
  private navigationQueue: Array<() => void> = [];

  async dismissAllModalsAndNavigate(path: string, delay: number = 300): Promise<void> {
    if (this.isNavigating) {
      console.log('[Navigation] Already navigating, adding to queue');
      return new Promise((resolve) => {
        this.navigationQueue.push(() => {
          this.dismissAllModalsAndNavigate(path, delay).then(resolve);
        });
      });
    }

    try {
      this.isNavigating = true;

      console.log('[Navigation] Dismissing all modals...');
      try {
        router.dismissAll();
      } catch (error) {
        console.warn('[Navigation] Error dismissing modals:', error);
      }

      console.log('[Navigation] Waiting for animations...');
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`[Navigation] Navigating to ${path}...`);
      router.replace(path as any);

      console.log('[Navigation] Navigation complete');
    } catch (error) {
      console.error('[Navigation] Error in dismissAllModalsAndNavigate:', error);
      try {
        router.replace(path as any);
      } catch (fallbackError) {
        console.error('[Navigation] Fallback navigation failed:', fallbackError);
      }
    } finally {
      this.isNavigating = false;

      if (this.navigationQueue.length > 0) {
        const nextNavigation = this.navigationQueue.shift();
        if (nextNavigation) {
          setTimeout(nextNavigation, 100);
        }
      }
    }
  }

  async safeSignOut(signOutFunction: () => Promise<void>): Promise<{
    success: boolean;
    error?: string;
  }> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        console.log(`[Navigation] Sign out attempt ${attempt + 1}/${maxRetries}`);

        console.log('[Navigation] Step 1: Clear AsyncStorage...');
        try {
          await AsyncStorage.multiRemove([
            'supabase.auth.token',
            '@supabase.auth.token',
            'user-preferences',
          ]);
        } catch (storageError) {
          console.warn('[Navigation] AsyncStorage clear warning:', storageError);
        }

        console.log('[Navigation] Step 2: Call sign out function...');
        await signOutFunction();

        console.log('[Navigation] Step 3: Verify session cleared...');
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.warn('[Navigation] Session still exists after signOut');
          throw new Error('Session not cleared');
        }

        console.log('[Navigation] Step 4: Navigate to login...');
        await this.dismissAllModalsAndNavigate('/login', 400);

        console.log('[Navigation] Sign out successful');
        return { success: true };
      } catch (error) {
        attempt++;
        console.error(`[Navigation] Sign out attempt ${attempt} failed:`, error);

        if (attempt >= maxRetries) {
          console.error('[Navigation] Max retries reached, forcing logout');

          try {
            await AsyncStorage.clear();
            await supabase.auth.signOut({ scope: 'local' });
          } catch (cleanupError) {
            console.error('[Navigation] Emergency cleanup failed:', cleanupError);
          }

          await this.dismissAllModalsAndNavigate('/login', 400);

          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
    };
  }

  navigateToNotifications(): void {
    try {
      console.log('[Navigation] Navigating to notifications...');
      router.push('/notifications');
    } catch (error) {
      console.error('[Navigation] Error navigating to notifications:', error);
    }
  }

  canNavigate(): boolean {
    return !this.isNavigating;
  }

  clearQueue(): void {
    this.navigationQueue = [];
  }
}

export const navigationService = new NavigationService();
