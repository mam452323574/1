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
  const { user, userProfile, loading, isEmailVerified, signOut } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [redirectCount, setRedirectCount] = useState(0);
  const [loopDetected, setLoopDetected] = useState(false);
  const [forceLogout, setForceLogout] = useState(false);
  const lastRedirectTime = useRef<number>(0);

  useEffect(() => {
    if (forceLogout) {
      console.log('[Navigation] Force logout triggered, redirecting to login');
      setForceLogout(false);
      setRedirectCount(0);
      setLoopDetected(false);
      router.replace('/login');
      return;
    }

    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'recipes' || segments[0] === 'exercises' || segments[0] === 'scan-preview' || segments[0] === 'settings' || segments[0] === 'premium-plan' || segments[0] === 'privacy-policy' || segments[0] === 'notifications' || segments[0] === 'notification-settings';
    const inUsernameSetup = segments[0] === 'username-setup';
    const inPremiumUpgrade = segments[0] === 'premium-upgrade';
    const inEmailVerification = segments[0] === 'email-verification';
    const inLogin = segments[0] === 'login' || segments[0] === 'signup';

    const now = Date.now();
    const timeSinceLastRedirect = now - lastRedirectTime.current;

    if (timeSinceLastRedirect < 1000 && !inAuthGroup && !inLogin) {
      setRedirectCount(prev => prev + 1);
    } else {
      if ((inAuthGroup || inLogin) && redirectCount > 0) {
        setRedirectCount(0);
        setLoopDetected(false);
      }
    }

    if (redirectCount >= 5 && !loopDetected) {
      console.error('[Navigation] LOOP DETECTED - Too many redirects!');
      setLoopDetected(true);
      Alert.alert(
        'Erreur de Navigation',
        'Une boucle de redirection a ete detectee. Cela peut indiquer un probleme avec la configuration de votre profil. Veuillez vous deconnecter et reessayer.',
        [
          {
            text: 'Se Deconnecter',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('[Navigation] Emergency logout initiated from loop detection');
                await signOut();
                setForceLogout(true);
              } catch (error) {
                console.error('[Navigation] Error during emergency logout:', error);
                setForceLogout(true);
              }
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

    if (!user && !inLogin && !inEmailVerification) {
      lastRedirectTime.current = now;
      router.replace('/login');
    } else if (user && userProfile && !isEmailVerified && !inEmailVerification && !inLogin) {
      lastRedirectTime.current = now;
      router.replace({
        pathname: '/email-verification',
        params: { email: user.email || '', userId: user.id, type: 'signup' },
      });
    } else if (user && isEmailVerified && !userProfile?.username && !inUsernameSetup && !inEmailVerification) {
      lastRedirectTime.current = now;
      router.replace('/username-setup');
    } else if (user && isEmailVerified && userProfile?.username && !inAuthGroup && !inUsernameSetup && !inPremiumUpgrade && !inLogin && !inEmailVerification) {
      lastRedirectTime.current = now;
      router.replace('/(tabs)');
    }
  }, [user, userProfile, loading, isEmailVerified, segments, redirectCount, forceLogout]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="email-verification" />
      <Stack.Screen name="username-setup" />
      <Stack.Screen name="premium-upgrade" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
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
