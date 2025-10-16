import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { BadgeProvider } from '@/contexts/BadgeContext';

function RootLayoutNav() {
  const { user, userProfile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'recipes' || segments[0] === 'exercises' || segments[0] === 'scan-preview' || segments[0] === 'settings' || segments[0] === 'premium-plan' || segments[0] === 'privacy-policy';
    const inUsernameSetup = segments[0] === 'username-setup';
    const inPremiumUpgrade = segments[0] === 'premium-upgrade';
    const inLogin = segments[0] === 'login' || segments[0] === 'signup';

    if (!user && inAuthGroup) {
      console.log('[Navigation] Not authenticated, redirecting to login');
      router.replace('/login');
    } else if (user && !userProfile?.username && !inUsernameSetup) {
      console.log('[Navigation] User missing username, redirecting to setup');
      router.replace('/username-setup');
    } else if (user && userProfile?.username && !inAuthGroup && !inUsernameSetup && !inPremiumUpgrade && !inLogin) {
      console.log('[Navigation] User authenticated, redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [user, userProfile, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="username-setup" />
      <Stack.Screen name="premium-upgrade" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="premium-plan" options={{ presentation: 'modal' }} />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="recipes" options={{ presentation: 'modal' }} />
      <Stack.Screen name="exercises" options={{ presentation: 'modal' }} />
      <Stack.Screen name="scan-preview" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <NotificationProvider>
        <BadgeProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </BadgeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
