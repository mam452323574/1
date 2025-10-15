import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { PremiumFeature } from '@/types';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

interface FeatureComparisonTableProps {
  features: PremiumFeature[];
}

export function FeatureComparisonTable({ features }: FeatureComparisonTableProps) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerColumn}>
          <Text style={styles.headerText}>Fonctionnalité</Text>
        </View>
        <View style={[styles.headerColumn, styles.freeColumn]}>
          <Text style={styles.headerText}>Gratuit</Text>
        </View>
        <View style={[styles.headerColumn, styles.premiumColumn]}>
          <Text style={[styles.headerText, styles.premiumText]}>Premium</Text>
        </View>
      </View>

      {features.map((feature) => (
        <View key={feature.id} style={styles.row}>
          <View style={styles.featureNameColumn}>
            <Text style={styles.featureName}>{feature.feature_name}</Text>
            {feature.feature_description && (
              <Text style={styles.featureDescription}>{feature.feature_description}</Text>
            )}
          </View>
          <View style={[styles.valueColumn, styles.freeColumn]}>
            {feature.free_tier_description ? (
              <Text style={styles.valueText}>{feature.free_tier_description}</Text>
            ) : (
              <X color={COLORS.error} size={20} strokeWidth={2} />
            )}
          </View>
          <View style={[styles.valueColumn, styles.premiumColumn]}>
            {feature.premium_tier_description ? (
              <Text style={[styles.valueText, styles.premiumValueText]}>
                {feature.premium_tier_description}
              </Text>
            ) : (
              <Check color={COLORS.success} size={20} strokeWidth={2} />
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.background,
  },
  headerColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
  },
  premiumText: {
    color: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  featureNameColumn: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
  },
  featureName: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primaryText,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: SIZES.text12,
    color: COLORS.gray,
    lineHeight: 16,
  },
  valueColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  valueText: {
    fontSize: SIZES.text12,
    color: COLORS.primaryText,
    textAlign: 'center',
  },
  premiumValueText: {
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  freeColumn: {
    backgroundColor: COLORS.background,
  },
  premiumColumn: {
    backgroundColor: '#FFF9F0',
  },
});
