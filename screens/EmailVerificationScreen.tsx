import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mail, RefreshCw, ArrowLeft, Check, Shield } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { getDeviceFingerprint, getDeviceName } from '@/services/deviceFingerprint';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function EmailVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; userId?: string; type?: string; returnTo?: string }>();
  const { sendVerificationEmail, verifyEmailCode, addTrustedDevice, user, signOut } = useAuth();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(15 * 60);
  const [rememberDevice, setRememberDevice] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);
  const expiryRef = useRef<NodeJS.Timeout | null>(null);

  const email = params.email || user?.email || '';
  const userId = params.userId || user?.id || '';
  const type = (params.type as 'signup' | 'login') || 'signup';

  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [cooldown]);

  useEffect(() => {
    if (expiresIn > 0 && !success) {
      expiryRef.current = setTimeout(() => setExpiresIn(expiresIn - 1), 1000);
    }
    return () => {
      if (expiryRef.current) clearTimeout(expiryRef.current);
    };
  }, [expiresIn, success]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];

    if (text.length > 1) {
      const chars = text.replace(/[^0-9]/g, '').split('').slice(0, CODE_LENGTH);
      chars.forEach((char, i) => {
        if (i < CODE_LENGTH) {
          newCode[i] = char;
        }
      });
      setCode(newCode);
      const lastFilledIndex = Math.min(chars.length - 1, CODE_LENGTH - 1);
      inputRefs.current[lastFilledIndex]?.focus();
      return;
    }

    const cleanedText = text.replace(/[^0-9]/g, '');
    newCode[index] = cleanedText;
    setCode(newCode);

    if (cleanedText && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== CODE_LENGTH) {
      setError('Veuillez entrer le code complet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isValid = await verifyEmailCode(fullCode, userId, type);

      if (isValid) {
        setSuccess(true);

        if (rememberDevice && type === 'login') {
          try {
            const fingerprint = await getDeviceFingerprint();
            const deviceName = getDeviceName();
            await addTrustedDevice(fingerprint, deviceName, userId);
          } catch (deviceError) {
            console.error('[Verification] Error saving trusted device:', deviceError);
          }
        }

        setTimeout(() => {
          if (type === 'signup') {
            router.replace('/username-setup');
          } else if (params.returnTo) {
            router.replace(params.returnTo as any);
          } else {
            router.replace('/(tabs)');
          }
        }, 1500);
      } else {
        setError('Code incorrect ou expire');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de verification');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setError(null);

    try {
      await sendVerificationEmail(email, userId, type);
      setCooldown(RESEND_COOLDOWN);
      setExpiresIn(15 * 60);
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setResending(false);
    }
  };

  const handleCancel = async () => {
    if (type === 'signup') {
      await signOut();
    }
    router.back();
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Check color={COLORS.white} size={48} />
          </View>
          <Text style={styles.successTitle}>Email verifie !</Text>
          <Text style={styles.successSubtitle}>
            {type === 'signup' ? 'Finalisons la creation de votre compte...' : 'Connexion en cours...'}
          </Text>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <ArrowLeft color={COLORS.darkGray} size={24} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Mail color={COLORS.primary} size={32} />
          </View>
          <Text style={styles.title}>Verifiez votre email</Text>
          <Text style={styles.subtitle}>
            Nous avons envoye un code a 6 chiffres a
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : null,
                error ? styles.codeInputError : null,
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, expiresIn < 60 ? styles.timerWarning : null]}>
            Code expire dans {formatTime(expiresIn)}
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {type === 'login' && (
          <TouchableOpacity
            style={styles.rememberContainer}
            onPress={() => setRememberDevice(!rememberDevice)}
          >
            <View style={[styles.checkbox, rememberDevice && styles.checkboxChecked]}>
              {rememberDevice && <Check color={COLORS.white} size={14} />}
            </View>
            <View style={styles.rememberTextContainer}>
              <Shield color={COLORS.gray} size={16} />
              <Text style={styles.rememberText}>Se souvenir de cet appareil</Text>
            </View>
          </TouchableOpacity>
        )}

        <Button
          title="Verifier"
          onPress={handleVerify}
          loading={loading}
          disabled={loading || code.join('').length !== CODE_LENGTH}
        />

        <TouchableOpacity
          style={[styles.resendButton, (cooldown > 0 || resending) && styles.resendDisabled]}
          onPress={handleResend}
          disabled={cooldown > 0 || resending}
        >
          {resending ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <RefreshCw color={cooldown > 0 ? COLORS.gray : COLORS.primary} size={18} />
              <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
                {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le code'}
              </Text>
            </>
          )}
        </TouchableOpacity>
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
    padding: SPACING.lg,
    paddingTop: SPACING.xl * 2,
  },
  backButton: {
    position: 'absolute',
    top: SPACING.xl,
    left: SPACING.lg,
    zIndex: 1,
    padding: SPACING.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
  email: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    textAlign: 'center',
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: COLORS.darkGray,
    backgroundColor: COLORS.white,
  },
  codeInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  codeInputError: {
    borderColor: COLORS.error,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  timerText: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  timerWarning: {
    color: COLORS.error,
    fontWeight: '600',
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
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 4,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rememberTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  rememberText: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  resendDisabled: {
    opacity: 0.6,
  },
  resendText: {
    fontSize: SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: COLORS.gray,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
