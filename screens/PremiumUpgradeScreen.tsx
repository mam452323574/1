import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, Check, X, Star, Zap, TrendingUp, Award } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { PremiumFeature } from '@/types';

export default function PremiumUpgradeScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [features, setFeatures] = useState<PremiumFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('premium_features')
        .select('*')
        .eq('enabled', true)
        .eq('requires_premium', true)
        .order('category');

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error loading features:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    setTimeout(() => {
      router.back();
      setPurchasing(false);
    }, 1500);
  };

  const isPremium = userProfile?.account_tier === 'premium';

  if (isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.alreadyPremiumContainer}>
          <View style={styles.premiumBadge}>
            <Crown color={COLORS.white} size={64} fill={COLORS.white} />
          </View>
          <Text style={styles.alreadyPremiumTitle}>Vous êtes Premium !</Text>
          <Text style={styles.alreadyPremiumText}>
            Vous avez accès à toutes les fonctionnalités premium
          </Text>
          <Button
            title="Retour"
            onPress={() => router.back()}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.crownContainer}>
          <Crown color={COLORS.primary} size={64} fill={COLORS.primary} />
          <View style={styles.sparkle1}>
            <Star color={COLORS.primary} size={20} fill={COLORS.primary} />
          </View>
          <View style={styles.sparkle2}>
            <Star color={COLORS.primary} size={16} fill={COLORS.primary} />
          </View>
        </View>
        <Text style={styles.title}>Health Scan Premium</Text>
        <Text style={styles.subtitle}>
          Débloquez tout le potentiel de votre santé
        </Text>
      </View>

      <View style={styles.pricingCard}>
        <View style={styles.pricingHeader}>
          <Text style={styles.price}>9,99 €</Text>
          <Text style={styles.priceperiod}>/mois</Text>
        </View>
        <Text style={styles.pricingSubtext}>Annulez à tout moment</Text>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Fonctionnalités Premium</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          features.map((feature) => (
            <View key={feature.id} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Check color={COLORS.success} size={20} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureName}>{feature.feature_name}</Text>
                {feature.feature_description && (
                  <Text style={styles.featureDescription}>
                    {feature.feature_description}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.benefitsSection}>
        <View style={styles.benefitItem}>
          <Zap color={COLORS.primary} size={24} />
          <Text style={styles.benefitText}>Accès instantané</Text>
        </View>
        <View style={styles.benefitItem}>
          <TrendingUp color={COLORS.primary} size={24} />
          <Text style={styles.benefitText}>Suivi avancé</Text>
        </View>
        <View style={styles.benefitItem}>
          <Award color={COLORS.primary} size={24} />
          <Text style={styles.benefitText}>Support prioritaire</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={purchasing ? "Traitement en cours..." : "S'abonner maintenant"}
          onPress={handlePurchase}
          loading={purchasing}
        />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Plus tard</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        Note: L'intégration complète des achats in-app Google Play / App Store nécessite RevenueCat.
        Cette interface démontre le flux utilisateur.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
  },
  crownContainer: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 0,
    left: -15,
  },
  title: {
    fontSize: SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
  pricingCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
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
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceperiod: {
    fontSize: SIZES.lg,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  pricingSubtext: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  featuresSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  benefitsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  benefitItem: {
    alignItems: 'center',
  },
  benefitText: {
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  backButton: {
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.md,
  },
  backButtonText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  disclaimer: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    fontStyle: 'italic',
  },
  alreadyPremiumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  premiumBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  alreadyPremiumTitle: {
    fontSize: SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  alreadyPremiumText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
});
