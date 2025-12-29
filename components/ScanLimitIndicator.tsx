import { View, Text, StyleSheet } from 'react-native';
import { ScanEligibilityResponse } from '@/types';
import { COLORS, SIZES, SPACING, FONT_WEIGHTS } from '@/constants/theme';

interface ScanLimitIndicatorProps {
  eligibility: ScanEligibilityResponse;
}

export function ScanLimitIndicator({ eligibility }: ScanLimitIndicatorProps) {
  const currentCount = eligibility.current_count || 0;
  const limit = eligibility.limit || 1;
  const remaining = limit - currentCount;
  const isLimitReached = !eligibility.allowed;

  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        {[...Array(limit)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < currentCount && styles.dotUsed,
            ]}
          />
        ))}
      </View>
      <Text style={[styles.text, isLimitReached && styles.textDisabled]}>
        {isLimitReached
          ? 'Limite atteinte'
          : `${remaining} scan${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray,
    opacity: 0.3,
  },
  dotUsed: {
    backgroundColor: COLORS.primary,
    opacity: 1,
  },
  text: {
    fontSize: SIZES.text12,
    color: COLORS.gray,
    fontWeight: FONT_WEIGHTS.regular,
  },
  textDisabled: {
    color: COLORS.gray,
    opacity: 0.6,
  },
});
