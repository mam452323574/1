import { View, Text, StyleSheet } from 'react-native';
import { ScanLimitStatus } from '@/types';
import { MAX_SCANS_PER_TYPE } from '@/constants/scan';
import { COLORS, SIZES, SPACING, FONT_WEIGHTS } from '@/constants/theme';

interface ScanLimitIndicatorProps {
  limitStatus: ScanLimitStatus;
}

export function ScanLimitIndicator({ limitStatus }: ScanLimitIndicatorProps) {
  const remaining = MAX_SCANS_PER_TYPE - limitStatus.currentCount;
  const isLimitReached = limitStatus.isLimitReached;

  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        {[...Array(MAX_SCANS_PER_TYPE)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < limitStatus.currentCount && styles.dotUsed,
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
