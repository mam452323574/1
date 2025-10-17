import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, X, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { PremiumFeature } from '@/types';
import { FeatureComparisonList } from '@/components/FeatureComparisonList';
import { Button } from '@/components/Button';
import { ModalHandle } from '@/components/ModalHandle';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

export default function PremiumPlanScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [features, setFeatures] = useState<PremiumFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('premium_features')
        .select('*')
        .eq('enabled', true)
        .order('category');

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error loading features:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = userProfile?.account_tier === 'premium';

  return (
    <View style={styles.container}>
      <ModalHandle />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <X color={COLORS.primaryText} size={24} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.crownContainer}>
              <Crown color={COLORS.primary} size={48} fill={COLORS.primary} />
              <View style={styles.sparkle}>
                <Sparkles color={COLORS.primary} size={20} fill={COLORS.primary} />
              </View>
            </View>
            <Text style={styles.title}>
              {isPremium ? 'Votre Plan Premium' : 'Passez à Premium'}
            </Text>
            <Text style={styles.subtitle}>
              {isPremium
                ? 'Profitez de tous les avantages premium'
                : 'Débloquez tout le potentiel de Health Scan'}
            </Text>
          </View>
        </View>

        {!isPremium && (
          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <Text style={styles.price}>9,99 €</Text>
              <Text style={styles.pricePeriod}>/mois</Text>
            </View>
            <Text style={styles.pricingSubtext}>Annulez à tout moment</Text>
          </View>
        )}

        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>Comparer les plans</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FeatureComparisonList features={features} />
          )}
        </View>

        {!isPremium && (
          <View style={styles.footerContent}>
            <Button
              title="Passer à Premium"
              onPress={() => router.push('/premium-upgrade')}
            />
            <TouchableOpacity
              style={styles.laterButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.laterButtonText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPremium && (
          <View style={styles.footerContent}>
            <Button
              title="Retour"
              onPress={() => router.back()}
            />
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
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
  header: {
    backgroundColor: COLORS.white,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.lg,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.xxxl,
    right: SPACING.page,
    zIndex: 10,
    padding: SPACING.xs,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.page,
  },
  crownContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  sparkle: {
    position: 'absolute',
    top: -5,
    right: -10,
  },
  title: {
    fontSize: SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.text16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  pricingCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginHorizontal: SPACING.page,
    marginTop: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 48,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  pricePeriod: {
    fontSize: SIZES.text18,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  pricingSubtext: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  comparisonSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.page,
  },
  comparisonTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: SPACING.xxxl,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  footerContent: {
    padding: SPACING.page,
    backgroundColor: COLORS.white,
    marginTop: SPACING.lg,
  },
  laterButton: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  laterButtonText: {
    fontSize: SIZES.text16,
    color: COLORS.gray,
    fontWeight: FONT_WEIGHTS.regular,
  },
});
