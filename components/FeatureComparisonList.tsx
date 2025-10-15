import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Check, X } from 'lucide-react-native';
import { PremiumFeature } from '@/types';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

interface FeatureComparisonListProps {
  features: PremiumFeature[];
}

export function FeatureComparisonList({ features }: FeatureComparisonListProps) {
  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, PremiumFeature[]>);

  return (
    <View style={styles.container}>
      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category}</Text>
          {categoryFeatures.map((feature) => (
            <View key={feature.id} style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureName}>{feature.feature_name}</Text>
                {feature.feature_description && (
                  <Text style={styles.featureDescription}>{feature.feature_description}</Text>
                )}
              </View>

              <View style={styles.comparisonRow}>
                <View style={styles.tierColumn}>
                  <Text style={styles.tierLabel}>Gratuit</Text>
                  <View style={styles.tierValueContainer}>
                    {feature.free_tier_description ? (
                      <Text style={styles.freeTierValue}>{feature.free_tier_description}</Text>
                    ) : (
                      <X color={COLORS.error} size={20} strokeWidth={2} />
                    )}
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={[styles.tierColumn, styles.premiumColumn]}>
                  <View style={styles.premiumLabelContainer}>
                    <Text style={styles.premiumLabel}>Premium</Text>
                    <Sparkles color={COLORS.primary} size={16} fill={COLORS.primary} />
                  </View>
                  <View style={styles.tierValueContainer}>
                    {feature.premium_tier_description ? (
                      <Text style={styles.premiumTierValue}>{feature.premium_tier_description}</Text>
                    ) : (
                      <Check color={COLORS.success} size={20} strokeWidth={2} />
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categorySection: {
    marginBottom: SPACING.xl,
  },
  categoryTitle: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featureCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  featureHeader: {
    marginBottom: SPACING.md,
  },
  featureName: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tierColumn: {
    flex: 1,
    alignItems: 'center',
  },
  premiumColumn: {
    backgroundColor: '#F0F8FF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  tierLabel: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  premiumLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  premiumLabel: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  tierValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  freeTierValue: {
    fontSize: SIZES.text16,
    color: COLORS.primaryText,
    textAlign: 'center',
  },
  premiumTierValue: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: SPACING.md,
  },
});
