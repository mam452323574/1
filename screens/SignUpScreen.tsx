import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Check, X, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { AvatarPicker } from '@/components/AvatarPicker';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, checkUsernameAvailability, isDisposableEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
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
        const isAvailable = await checkUsernameAvailability(username);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameStatus('idle');
      }
    }, 300);

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
    if (!email || !password || !confirmPassword || !username) {
      setError('Veuillez remplir tous les champs obligatoires');
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

      await signUp(email, password, username, avatarUrl || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return null;
      case 'available':
        return <Check color={COLORS.success} size={20} />;
      case 'taken':
        return <X color={COLORS.error} size={20} />;
      case 'invalid':
        return <AlertCircle color={COLORS.error} size={20} />;
      default:
        return null;
    }
  };

  const getUsernameStatusText = () => {
    switch (usernameStatus) {
      case 'checking':
        return 'Vérification...';
      case 'available':
        return 'Disponible';
      case 'taken':
        return 'Déjà pris';
      case 'invalid':
        return '3-20 caractères, lettres, chiffres, _ ou -';
      default:
        return '';
    }
  };

  const getUsernameStatusColor = () => {
    switch (usernameStatus) {
      case 'available':
        return COLORS.success;
      case 'taken':
      case 'invalid':
        return COLORS.error;
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

          <View style={styles.avatarSection}>
            <AvatarPicker
              userId="temp"
              currentAvatarUrl={avatarUrl}
              onAvatarSelected={setAvatarUrl}
              size={100}
            />
            <Text style={styles.avatarHint}>Optionnel</Text>
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
              {usernameStatus !== 'idle' && (
                <Text style={[styles.statusText, { color: getUsernameStatusColor() }]}>
                  {getUsernameStatusText()}
                </Text>
              )}
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
              disabled={usernameStatus !== 'available'}
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarHint: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
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
