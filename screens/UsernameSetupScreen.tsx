import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Check, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { supabase } from '@/services/supabase';

export default function UsernameSetupScreen() {
  const router = useRouter();
  const { user, updateUserProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'invalid' | 'valid'>('idle');
  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
  }, [user]);

  useEffect(() => {
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

    setUsernameStatus('valid');
  }, [username]);

  const validateUsername = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setUsername(cleaned);
  };

  const handleComplete = async () => {
    if (!user) {
      console.error('[UsernameSetup] No user found');
      return;
    }

    if (!username) {
      setError('Veuillez choisir un nom d\'utilisateur');
      return;
    }

    if (usernameStatus !== 'valid') {
      setError('Veuillez choisir un nom d\'utilisateur valide');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[UsernameSetup] Starting profile completion for user:', user.id);
      console.log('[UsernameSetup] Username:', username);

      await updateUserProfile({
        username,
      });
      console.log('[UsernameSetup] Profile updated successfully');

      const provider = user.app_metadata.provider || 'google';
      console.log('[UsernameSetup] Creating OAuth connection for provider:', provider);

      const { error: oauthError } = await supabase.from('oauth_connections').insert({
        user_id: user.id,
        provider,
        provider_user_id: user.id,
        provider_email: user.email,
        metadata: user.user_metadata || {},
      });

      if (oauthError && !oauthError.message.includes('duplicate')) {
        console.error('[UsernameSetup] OAuth connection error:', oauthError);
        throw oauthError;
      }
      console.log('[UsernameSetup] OAuth connection created successfully');

      const today = new Date().toISOString().split('T')[0];
      console.log('[UsernameSetup] Creating initial health score');

      const { error: healthError } = await supabase.from('health_scores').insert({
        user_id: user.id,
        score: 50,
        calories_current: 0,
        calories_goal: 2000,
        bodyfat: 20,
        muscle: 40,
        date: today,
      });

      if (healthError && !healthError.message.includes('duplicate')) {
        console.error('[UsernameSetup] Health score error:', healthError);
        throw healthError;
      }
      console.log('[UsernameSetup] Initial health score created successfully');

      console.log('[UsernameSetup] Setup complete, redirecting to tabs');
      router.replace('/(tabs)');
    } catch (err) {
      console.error('[UsernameSetup] Critical error during setup:', err);

      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la configuration';
      setError(errorMessage);

      Alert.alert(
        'Erreur de Configuration',
        `Une erreur est survenue lors de la création de votre profil:\n\n${errorMessage}\n\nVeuillez réessayer ou contacter le support si le problème persiste.`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'valid':
        return <Check color={COLORS.success} size={20} />;
      case 'invalid':
        return <AlertCircle color={COLORS.error} size={20} />;
      default:
        return null;
    }
  };

  const getUsernameStatusText = () => {
    switch (usernameStatus) {
      case 'valid':
        return 'Valide';
      case 'invalid':
        return '3-20 caractères, lettres, chiffres, _ ou -';
      default:
        return '';
    }
  };

  const getUsernameStatusColor = () => {
    switch (usernameStatus) {
      case 'valid':
        return COLORS.success;
      case 'invalid':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Heart color={COLORS.primary} size={48} fill={COLORS.primary} />
          <Text style={styles.title}>Bienvenue !</Text>
          <Text style={styles.subtitle}>Choisissez votre nom d'utilisateur (peut être identique à d'autres)</Text>
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

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            title="Commencer"
            onPress={handleComplete}
            loading={loading}
            disabled={usernameStatus !== 'valid'}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
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
});
