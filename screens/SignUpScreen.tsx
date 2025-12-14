import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, sendVerificationEmail, isDisposableEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const isDisposable = await isDisposableEmail(email);
      if (isDisposable) {
        setError('Les adresses email temporaires ne sont pas autorisees');
        return;
      }

      const { userId, email: userEmail } = await signUp(email, password);

      await sendVerificationEmail(userEmail, userId, 'signup');

      router.push({
        pathname: '/email-verification',
        params: { email: userEmail, userId, type: 'signup' },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'inscription';
      if (errorMessage.includes('already registered')) {
        setError('Cette adresse email est deja utilisee');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
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
            <Text style={styles.subtitle}>Creez votre compte</Text>
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
                  placeholder="Minimum 6 caracteres"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={styles.inputWithIcon}>
                <Lock color={COLORS.gray} size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithPadding}
                  placeholder="Retapez votre mot de passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  placeholderTextColor={COLORS.gray}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  {showConfirmPassword ? (
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

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Un code de verification sera envoye a votre adresse email.
              </Text>
            </View>

            <Button
              title="Continuer"
              onPress={handleSignUp}
              loading={loading}
              disabled={loading || !email || !password || !confirmPassword}
            />

            <TouchableOpacity
              style={styles.loginContainer}
              onPress={() => router.back()}
            >
              <Text style={styles.loginText}>
                Deja un compte?{' '}
                <Text style={styles.loginLink}>Se connecter</Text>
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
  infoContainer: {
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    color: COLORS.darkGray,
    fontSize: SIZES.sm,
    textAlign: 'center',
  },
  loginContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  loginText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
