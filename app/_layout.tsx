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
    if (loading) return;
    if (isNavigating || isSigningOut) return;

    if (!hasInitialized) {
      setHasInitialized(true);
    }

    const now = Date.now();
    const timeSinceLastNav = now - lastNavigationTime.current;

    if (timeSinceLastNav < 500) {
      navigationAttempts.current++;
      if (navigationAttempts.current >= 5) {
        console.warn('[Navigation] Too many rapid attempts, blocking temporarily');
        return;
      }
    } else {
      navigationAttempts.current = 0;
    }

    const AUTHENTICATED_ROUTES = [
      '(tabs)', 'recipes', 'exercises', 'scan-preview', 'settings',
      'premium-plan', 'privacy-policy', 'notifications', 'notification-settings',
      'scan-detail', 'scan-history', 'scan-results', 'trusted-devices', 'premium-upgrade'
    ];

    const firstSegment = segments[0] || '';
    const secondSegment = segments[1] || '';

    const inAuthGroup = AUTHENTICATED_ROUTES.includes(firstSegment);
    const inAuth = firstSegment === '(auth)';
    const inUsernameSetup = inAuth && secondSegment === 'username-setup';
    const inEmailVerification = inAuth && secondSegment === 'email-verification';
    const inLogin = inAuth && (secondSegment === 'login' || secondSegment === 'signup');

    const performNavigation = async (path: string) => {
      try {
        setIsNavigating(true);
        lastNavigationTime.current = now;
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace(path as any);
        setTimeout(() => {
          setIsNavigating(false);
          navigationAttempts.current = 0;
        }, 300);
      } catch (error) {
        console.error('[Navigation] Failed:', error);
        setIsNavigating(false);
      }
    };

    if (pendingVerification && !inEmailVerification) return;

    if (!user && !inAuth) {
      performNavigation('/(auth)/login');
    } else if (user && !userProfile?.username && !inUsernameSetup && !pendingVerification) {
      performNavigation('/(auth)/username-setup');
    } else if (user && userProfile?.username && !inAuthGroup && !inAuth) {
      performNavigation('/(tabs)');
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
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
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
