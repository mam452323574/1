import { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Crown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';

interface FeatureGateProps {
  featureKey: string;
  featureName: string;
  featureDescription?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({
  featureKey,
  featureName,
  featureDescription,
  children,
  fallback,
}: FeatureGateProps) {
  const router = useRouter();
  const { userProfile } = useAuth();

  const isPremium = userProfile?.account_tier === 'premium';

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.lockContainer}>
        <View style={styles.iconBackground}>
          <Lock color={COLORS.primary} size={48} />
        </View>
        <View style={styles.crownBadge}>
          <Crown color={COLORS.white} size={20} fill={COLORS.white} />
        </View>
      </View>

      <Text style={styles.title}>Fonctionnalité Premium</Text>
      <Text style={styles.featureName}>{featureName}</Text>

      {featureDescription && (
        <Text style={styles.description}>{featureDescription}</Text>
      )}

      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={() => router.push('/premium-upgrade')}
      >
        <Crown color={COLORS.white} size={20} fill={COLORS.white} />
        <Text style={styles.upgradeButtonText}>Passer à Premium</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Débloquez cette fonctionnalité et bien plus encore
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  lockContainer: {
    position: 'relative',
    marginBottom: SPACING.xl,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  crownBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  title: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  featureName: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    maxWidth: 300,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  upgradeButtonText: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  hint: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});
