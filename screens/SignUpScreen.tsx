import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Check, X, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, checkUsernameAvailability, isDisposableEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'network_error' | 'timeout'>('idle');
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    if (!username) {
      setUsernameStatus('idle');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setUsernameStatus('invalid');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');

    const timeout = setTimeout(async () => {
      try {
        console.log('[Username Check] Starting validation for:', username);
        const isAvailable = await checkUsernameAvailability(username);
        console.log('[Username Check] Result:', isAvailable ? 'available' : 'taken');
        setUsernameStatus(isAvailable ? 'available' : 'taken');
      } catch (error) {
        console.error('[Username Check] Error:', error);
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setUsernameStatus('network_error');
        } else if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
          setUsernameStatus('timeout');
        } else {
          setUsernameStatus('network_error');
        }
      }
    }, 500);

    setCheckTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [username]);

  const validateUsername = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setUsername(cleaned);
  };

  const handleSignUp = async () => {
    setError(null);

    if (!email || !password || !confirmPassword || !username) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, _ ou -');
      return;
    }

    if (usernameStatus === 'checking') {
      setError('Vérification du nom d\'utilisateur en cours, veuillez patienter');
      return;
    }

    if (usernameStatus === 'network_error' || usernameStatus === 'timeout') {
      try {
        console.log('[SignUp] Retrying username verification before signup...');
        setUsernameStatus('checking');
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setError('Ce nom d\'utilisateur est déjà pris');
          setUsernameStatus('taken');
          return;
        }
        setUsernameStatus('available');
        console.log('[SignUp] Username verified successfully');
      } catch (err) {
        console.error('[SignUp] Final verification failed:', err);
        setError('Impossible de vérifier la disponibilité du nom d\'utilisateur. Veuillez vérifier votre connexion et réessayer.');
        setUsernameStatus('network_error');
        return;
      }
    }

    if (usernameStatus === 'taken') {
      setError('Ce nom d\'utilisateur est déjà pris, veuillez en choisir un autre');
      return;
    }

    if (usernameStatus !== 'available') {
      setError('Veuillez choisir un nom d\'utilisateur valide et disponible');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const isDisposable = await isDisposableEmail(email);
      if (isDisposable) {
        setError('Les adresses email temporaires ne sont pas autorisées');
        return;
      }

      await signUp(email, password, username);

      console.log('[SignUp] Inscription réussie, redirection vers l\'application');
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <ActivityIndicator size="small" color={COLORS.primary} />;
      case 'available':
        return <Check color={COLORS.success} size={20} />;
      case 'taken':
        return <X color={COLORS.error} size={20} />;
      case 'invalid':
        return <AlertCircle color={COLORS.error} size={20} />;
      case 'network_error':
      case 'timeout':
        return <AlertCircle color={COLORS.warning} size={20} />;
      default:
        return null;
    }
  };

  const getUsernameStatusText = () => {
    switch (usernameStatus) {
      case 'checking':
        return 'Vérification de la disponibilité...';
      case 'available':
        return 'Disponible !';
      case 'taken':
        return 'Déjà pris, essayez un autre';
      case 'invalid':
        return '3-20 caractères : lettres, chiffres, _ ou -';
      case 'network_error':
        return 'Erreur réseau - Touchez pour réessayer';
      case 'timeout':
        return 'Délai d\'attente dépassé - Touchez pour réessayer';
      default:
        return '3-20 caractères : lettres, chiffres, _ ou -';
    }
  };

  const getUsernameStatusColor = () => {
    switch (usernameStatus) {
      case 'checking':
        return COLORS.primary;
      case 'available':
        return COLORS.success;
      case 'taken':
      case 'invalid':
        return COLORS.error;
      case 'network_error':
      case 'timeout':
        return COLORS.warning;
      default:
        return COLORS.gray;
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
          <Text style={styles.subtitle}>Créez votre compte</Text>
        </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom d'utilisateur *</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, styles.inputWithStatus]}
                  placeholder="pseudo123"
                  value={username}
                  onChangeText={validateUsername}
                  autoCapitalize="none"
                  autoComplete="off"
                  placeholderTextColor={COLORS.gray}
                />
                <View style={styles.statusIcon}>
                  {getUsernameStatusIcon()}
                </View>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  if (usernameStatus === 'network_error' || usernameStatus === 'timeout') {
                    setUsernameStatus('checking');
                    try {
                      const isAvailable = await checkUsernameAvailability(username);
                      setUsernameStatus(isAvailable ? 'available' : 'taken');
                    } catch (error) {
                      console.error('[Manual Retry] Error:', error);
                      const errorMessage = error instanceof Error ? error.message : '';
                      if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
                        setUsernameStatus('timeout');
                      } else {
                        setUsernameStatus('network_error');
                      }
                    }
                  }
                }}
                disabled={usernameStatus !== 'network_error' && usernameStatus !== 'timeout'}
              >
                <Text style={[styles.statusText, { color: getUsernameStatusColor() }]}>
                  {getUsernameStatusText()}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
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
              <Text style={styles.label}>Mot de passe *</Text>
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmer le mot de passe *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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
              title="S'inscrire"
              onPress={handleSignUp}
              loading={loading}
              disabled={loading || !email || !password || !confirmPassword || !username || username.length < 3}
            />

            <TouchableOpacity
              style={styles.loginContainer}
              onPress={() => router.back()}
            >
              <Text style={styles.loginText}>
                Déjà un compte?{' '}
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
    marginBottom: SPACING.lg,
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
    position: 'relative',
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
  inputWithStatus: {
    paddingRight: 40,
  },
  statusIcon: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  statusText: {
    fontSize: SIZES.sm,
    marginTop: SPACING.xs,
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
