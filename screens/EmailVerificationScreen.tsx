import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Heart, Mail, Clock } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

interface EmailVerificationScreenProps {
  email: string;
  onVerify: (code: string, trustDevice: boolean) => Promise<void>;
  onResend: () => Promise<void>;
}

export default function EmailVerificationScreen() {
  const router = useRouter();
  const { pendingVerification, verifyEmailCode, sendVerificationCode, cancelVerification } = useAuth();
  const email = pendingVerification?.email;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [trustDevice, setTrustDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);

  useEffect(() => {
    if (!pendingVerification) {
      console.log('[EmailVerification] No pending verification, redirecting to login');
      router.replace('/login');
    }
  }, [pendingVerification]);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    setError(null);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '') && text) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const finalCode = verificationCode || code.join('');

    if (finalCode.length !== 6) {
      setError('Veuillez entrer le code complet');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await verifyEmailCode(finalCode, trustDevice);
      console.log('[EmailVerification] Verification successful, redirecting to tabs');
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code de vérification invalide');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;

    try {
      setError(null);
      await sendVerificationCode(email);
      setResendCooldown(60);
      setTimeRemaining(15 * 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du code');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Mail color={COLORS.primary} size={64} />
            <Text style={styles.title}>Vérifiez votre email</Text>
            <Text style={styles.subtitle}>
              Nous avons envoyé un code de vérification à
            </Text>
            <Text style={styles.email}>{email || 'votre email'}</Text>
          </View>

          <View style={styles.timerContainer}>
            <Clock color={timeRemaining < 60 ? COLORS.error : COLORS.gray} size={20} />
            <Text style={[styles.timerText, timeRemaining < 60 && styles.timerWarning]}>
              Code expire dans {formatTime(timeRemaining)}
            </Text>
          </View>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                  error && styles.codeInputError,
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text.slice(-1), index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.trustDeviceContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setTrustDevice(!trustDevice)}
              disabled={loading}
            >
              <View style={[styles.checkboxBox, trustDevice && styles.checkboxBoxChecked]}>
                {trustDevice && <Text style={styles.checkboxCheckmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Faire confiance à cet appareil pendant 30 jours
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title={loading ? 'Vérification...' : 'Vérifier'}
            onPress={() => handleVerify()}
            loading={loading}
            disabled={loading || code.some(digit => digit === '')}
          />

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Vous n'avez pas reçu le code ?</Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendCooldown > 0}
            >
              <Text style={[
                styles.resendLink,
                resendCooldown > 0 && styles.resendLinkDisabled
              ]}>
                {resendCooldown > 0
                  ? `Renvoyer dans ${resendCooldown}s`
                  : 'Renvoyer le code'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={async () => {
              await cancelVerification();
              router.replace('/login');
            }}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Annuler et retourner à la connexion</Text>
          </TouchableOpacity>
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
    color: COLORS.darkGray,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  email: {
    fontSize: SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
  },
  timerText: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  timerWarning: {
    color: COLORS.error,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  codeInput: {
    width: 50,
    height: 60,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    fontSize: SIZES.xl,
    textAlign: 'center',
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  codeInputFilled: {
    borderColor: COLORS.primary,
  },
  codeInputError: {
    borderColor: COLORS.error,
  },
  trustDeviceContainer: {
    marginBottom: SPACING.lg,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.gray,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxCheckmark: {
    color: COLORS.white,
    fontSize: SIZES.md,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: SIZES.sm,
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
  resendContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  resendText: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  resendLink: {
    fontSize: SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: COLORS.gray,
  },
  backButton: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
});
