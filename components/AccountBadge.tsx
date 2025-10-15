import { View, Text, StyleSheet } from 'react-native';
import { Crown } from 'lucide-react-native';
import { AccountTier } from '@/types';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

interface AccountBadgeProps {
  tier: AccountTier;
  size?: 'small' | 'medium' | 'large';
}

export function AccountBadge({ tier, size = 'medium' }: AccountBadgeProps) {
  const isPremium = tier === 'premium';

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      text: styles.textSmall,
      icon: 16,
    },
    medium: {
      container: styles.containerMedium,
      text: styles.textMedium,
      icon: 20,
    },
    large: {
      container: styles.containerLarge,
      text: styles.textLarge,
      icon: 24,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, currentSize.container, isPremium ? styles.premium : styles.free]}>
      {isPremium && (
        <Crown
          color={COLORS.white}
          size={currentSize.icon}
          fill={COLORS.white}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, currentSize.text]}>
        {isPremium ? 'Compte Premium' : 'Compte Gratuit'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.button,
  },
  containerSmall: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  containerMedium: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  containerLarge: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  premium: {
    backgroundColor: COLORS.primary,
  },
  free: {
    backgroundColor: COLORS.gray,
  },
  icon: {
    marginRight: SPACING.xs,
  },
  text: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  textSmall: {
    fontSize: SIZES.text12,
  },
  textMedium: {
    fontSize: SIZES.text14,
  },
  textLarge: {
    fontSize: SIZES.text16,
  },
});
