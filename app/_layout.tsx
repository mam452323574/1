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
  const [redirectCount, setRedirectCount] = useState(0);
  const [loopDetected, setLoopDetected] = useState(false);
  const lastRedirectTime = useRef<number>(0);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'recipes' || segments[0] === 'exercises' || segments[0] === 'scan-preview' || segments[0] === 'settings' || segments[0] === 'premium-plan' || segments[0] === 'privacy-policy' || segments[0] === 'notifications' || segments[0] === 'notification-settings';
    const inUsernameSetup = segments[0] === 'username-setup';
    const inPremiumUpgrade = segments[0] === 'premium-upgrade';
    const inEmailVerification = segments[0] === 'email-verification';
    const inLogin = segments[0] === 'login' || segments[0] === 'signup';

    const now = Date.now();
    const timeSinceLastRedirect = now - lastRedirectTime.current;

    if (timeSinceLastRedirect < 1000 && !inAuthGroup && !inLogin && !inEmailVerification) {
      console.warn('[Navigation] Rapid redirect detected, incrementing counter');
      setRedirectCount(prev => prev + 1);
    } else {
      if ((inAuthGroup || inLogin || inEmailVerification) && redirectCount > 0) {
        console.log('[Navigation] User reached stable state, resetting counter');
        setRedirectCount(0);
        setLoopDetected(false);
      }
    }

    if (redirectCount >= 5) {
      console.error('[Navigation] LOOP DETECTED - Too many redirects!');
      setLoopDetected(true);
      Alert.alert(
        'Erreur de Navigation',
        'Une boucle de redirection a été détectée. Cela peut indiquer un problème avec la configuration de votre profil. Veuillez vous déconnecter et réessayer.',
        [
          {
            text: 'Se Déconnecter',
            style: 'destructive',
            onPress: async () => {
              setRedirectCount(0);
              setLoopDetected(false);
              await signOut();
              router.replace('/login');
            },
          },
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => {
              setRedirectCount(0);
              setLoopDetected(false);
            },
          },
        ]
      );
      return;
    }

    if (pendingVerification && !inEmailVerification) {
      console.log('[Navigation] Pending verification detected, staying on verification flow');
      return;
    }

    if (!user && !inLogin && !inEmailVerification) {
      console.log('[Navigation] No user detected, redirecting to login');
      lastRedirectTime.current = now;
      router.replace('/login');
    } else if (user && !userProfile?.username && !inUsernameSetup && !pendingVerification) {
      console.log('[Navigation] User missing username, redirecting to setup');
      console.log('[Navigation] User ID:', user.id);
      console.log('[Navigation] User Profile:', userProfile);
      lastRedirectTime.current = now;
      router.replace('/username-setup');
    } else if (user && userProfile?.username && !inAuthGroup && !inUsernameSetup && !inPremiumUpgrade && !inLogin && !inEmailVerification) {
      console.log('[Navigation] User authenticated, redirecting to tabs');
      lastRedirectTime.current = now;
      router.replace('/(tabs)');
    }
  }, [user, userProfile, loading, segments, redirectCount, pendingVerification]);

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
