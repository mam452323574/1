import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { BadgeProvider } from '@/contexts/BadgeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/Button';
import { COLORS, SPACING, SIZES } from '@/constants/theme';

function RootLayoutNav() {
  const { user, userProfile, loading, pendingVerification, signOut } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigationAttempts = useRef<number>(0);
  const lastNavigationTime = useRef<number>(0);

  useEffect(() => {
    if (loading) {
      console.log('[Navigation] Still loading auth state...');
      return;
    }

    if (isNavigating || isSigningOut) {
      console.log('[Navigation] Navigation in progress, skipping...');
      return;
    }

    if (!hasInitialized) {
      console.log('[Navigation] Initial navigation setup');
      setHasInitialized(true);
    }

    const now = Date.now();
    const timeSinceLastNav = now - lastNavigationTime.current;

    if (timeSinceLastNav < 500) {
      navigationAttempts.current++;
      console.warn(`[Navigation] Rapid navigation attempt #${navigationAttempts.current}`);

      if (navigationAttempts.current >= 3) {
        console.error('[Navigation] Too many rapid navigation attempts, blocking');
        return;
      }
    } else {
      navigationAttempts.current = 0;
    }

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'recipes' || segments[0] === 'exercises' || segments[0] === 'scan-preview' || segments[0] === 'settings' || segments[0] === 'premium-plan' || segments[0] === 'privacy-policy' || segments[0] === 'notifications' || segments[0] === 'notification-settings' || segments[0] === 'scan-detail' || segments[0] === 'scan-history' || segments[0] === 'scan-results' || segments[0] === 'trusted-devices';
    const inUsernameSetup = segments[0] === 'username-setup';
    const inPremiumUpgrade = segments[0] === 'premium-upgrade';
    const inEmailVerification = segments[0] === 'email-verification';
    const inLogin = segments[0] === 'login' || segments[0] === 'signup';

    const performNavigation = async (path: string, reason: string) => {
      try {
        console.log(`[Navigation] ${reason} -> ${path}`);
        setIsNavigating(true);
        lastNavigationTime.current = now;

        await new Promise(resolve => setTimeout(resolve, 100));

        router.replace(path as any);

        setTimeout(() => {
          setIsNavigating(false);
          navigationAttempts.current = 0;
        }, 300);
      } catch (error) {
        console.error('[Navigation] Navigation failed:', error);
        setIsNavigating(false);
      }
    };

    if (pendingVerification && !inEmailVerification) {
      console.log('[Navigation] Pending verification, staying on current flow');
      return;
    }

    if (!user && !inLogin && !inEmailVerification) {
      performNavigation('/login', 'No user detected');
    } else if (user && !userProfile?.username && !inUsernameSetup && !pendingVerification) {
      console.log('[Navigation] User missing username');
      console.log('[Navigation] User ID:', user.id);
      console.log('[Navigation] User Profile:', userProfile);
      performNavigation('/username-setup', 'Username setup required');
    } else if (user && userProfile?.username && !inAuthGroup && !inUsernameSetup && !inPremiumUpgrade && !inLogin && !inEmailVerification) {
      performNavigation('/(tabs)', 'User authenticated');
    }
  }, [user, userProfile, loading, segments, pendingVerification, isNavigating, hasInitialized, isSigningOut]);

  if (!hasInitialized || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="email-verification" />
      <Stack.Screen name="username-setup" />
      <Stack.Screen name="premium-upgrade" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="trusted-devices" options={{ presentation: 'modal' }} />
      <Stack.Screen name="premium-plan" options={{ presentation: 'modal' }} />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notification-settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="scan-detail" />
      <Stack.Screen name="scan-history" />
      <Stack.Screen name="scan-results" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="recipes" options={{ presentation: 'modal' }} />
      <Stack.Screen name="exercises" options={{ presentation: 'modal' }} />
      <Stack.Screen name="scan-preview" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: SIZES.lg,
    color: COLORS.gray,
    fontWeight: '500',
  },
});

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <BadgeProvider>
            <RootLayoutNav />
            <StatusBar style="auto" />
          </BadgeProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
