import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { OAuthButton } from '@/components/OAuthButton';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithOAuth, sendVerificationCode, verifyEmailCode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await signIn(email, password);

      if (result.needsVerification) {
        await sendVerificationCode(email);
        router.push({
          pathname: '/email-verification',
          params: {
            email,
            onVerify: async (code: string, trustDevice: boolean) => {
              await verifyEmailCode(code, trustDevice);
              router.replace('/(tabs)');
            },
            onResend: async () => {
              await sendVerificationCode(email);
            },
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    try {
      setOauthLoading(provider);
      setError(null);
      await signInWithOAuth(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erreur de connexion avec ${provider}`);
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
        <View style={styles.header}>
          <Heart color={COLORS.primary} size={48} fill={COLORS.primary} />
          <Text style={styles.title}>Health Scan</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
        </View>

          <View style={styles.oauthSection}>
            <OAuthButton
              provider="google"
              onPress={() => handleOAuthLogin('google')}
              loading={oauthLoading === 'google'}
              disabled={oauthLoading !== null || loading}
            />
            <View style={{ height: SPACING.md }} />
            <OAuthButton
              provider="apple"
              onPress={() => handleOAuthLogin('apple')}
              loading={oauthLoading === 'apple'}
              disabled={oauthLoading !== null || loading}
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
          />

            <TouchableOpacity
              style={styles.signupContainer}
              onPress={() => router.push('/signup')}
            >
              <Text style={styles.signupText}>
                Pas encore de compte?{' '}
                <Text style={styles.signupLink}>S'inscrire</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    marginTop: SPACING.sm,
  },
  oauthSection: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: SIZES.md,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    color: COLORS.darkGray,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.sm,
    textAlign: 'center',
  },
  signupContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  signupText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  signupLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
