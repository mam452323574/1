import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { OAuthButton } from '@/components/OAuthButton';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithOAuth, sendVerificationEmail, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const { needsVerification, userId } = await signIn(email, password);

      if (needsVerification) {
        await sendVerificationEmail(email, userId, 'login');
        router.push({
          pathname: '/email-verification',
          params: { email, userId, type: 'login' },
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect');
      } else {
        setError(errorMessage);
      }
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
              <View style={styles.inputWithIcon}>
                <Mail color={COLORS.gray} size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithPadding}
                  placeholder="votre@email.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  placeholderTextColor={COLORS.gray}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWithIcon}>
                <Lock color={COLORS.gray} size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithPadding}
                  placeholder="Entrez votre mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  placeholderTextColor={COLORS.gray}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff color={COLORS.gray} size={20} />
                  ) : (
                    <Eye color={COLORS.gray} size={20} />
                  )}
                </TouchableOpacity>
              </View>
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  inputWithPadding: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  eyeIcon: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
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
