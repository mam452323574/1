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

    if (!user && inAuthGroup) {
      router.replace('/login');
    } else if (user && !userProfile?.username && !inUsernameSetup) {
      router.replace('/username-setup');
    } else if (user && userProfile?.username && !inAuthGroup && !inUsernameSetup && !inPremiumUpgrade) {
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
