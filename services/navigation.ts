import { router } from 'expo-router';

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
