import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, Check, X, Star, Zap, TrendingUp, Award, RefreshCw } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { ModalHandle } from '@/components/ModalHandle';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { PremiumFeature } from '@/types';
import { paymentService } from '@/services/payment';

export default function PremiumUpgradeScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [features, setFeatures] = useState<PremiumFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [productPrice, setProductPrice] = useState<string>('9,99 €');

  useEffect(() => {
    loadFeatures();
    initializePayment();

    return () => {
      paymentService.cleanup();
    };
  }, []);

  const initializePayment = async () => {
    try {
      await paymentService.initialize();
      const product = await paymentService.getProductDetails();
      if (product && product.localizedPrice) {
        setProductPrice(product.localizedPrice);
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
    }
  };

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
    if (Platform.OS === 'web') {
      Alert.alert(
        'Non disponible sur Web',
        'Les achats in-app ne sont disponibles que sur les applications mobiles natives (Android/iOS). Veuillez utiliser l\'application mobile pour effectuer un achat.'
      );
      return;
    }

    try {
      setPurchasing(true);

      const result = await paymentService.purchaseProduct();

      if (result.success) {
        Alert.alert(
          'Validation en cours',
          'Votre achat est en cours de validation. Veuillez patienter quelques instants...'
        );

        await new Promise(resolve => setTimeout(resolve, 2000));
        await refreshUserProfile();

        Alert.alert(
          'Bienvenue dans Premium!',
          'Votre abonnement Premium a été activé avec succès. Profitez de toutes les fonctionnalités!',
          [
            {
              text: 'Continuer',
              onPress: () => router.back(),
            },
          ]
        );
      } else if (result.error === 'cancelled') {
        console.log('Purchase cancelled by user');
      } else {
        Alert.alert(
          'Erreur d\'achat',
          result.message || 'Une erreur est survenue lors de l\'achat. Veuillez réessayer.'
        );
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Erreur',
        'Impossible de traiter votre achat. Veuillez vérifier votre connexion et réessayer.'
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Non disponible sur Web',
        'La restauration des achats n\'est disponible que sur les applications mobiles.'
      );
      return;
    }

    try {
      setRestoring(true);

      const result = await paymentService.restorePurchases();

      if (result.success) {
        await refreshUserProfile();

        Alert.alert(
          'Achats restaurés',
          'Votre abonnement Premium a été restauré avec succès!',
          [
            {
              text: 'Continuer',
              onPress: () => router.back(),
            },
          ]
        );
      } else if (result.error === 'no_purchases') {
        Alert.alert(
          'Aucun achat trouvé',
          'Aucun achat précédent n\'a été trouvé sur ce compte.'
        );
      } else {
        Alert.alert(
          'Erreur de restauration',
          result.message || 'Impossible de restaurer vos achats. Veuillez réessayer.'
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la restauration. Veuillez réessayer.'
      );
    } finally {
      setRestoring(false);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          console.log('User profile refreshed:', data.account_tier);
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
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
      <ModalHandle />
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
          <Text style={styles.price}>{productPrice}</Text>
          <Text style={styles.priceperiod}>/mois</Text>
        </View>
        <Text style={styles.pricingSubtext}>Annulez à tout moment</Text>
        {Platform.OS !== 'web' && (
          <Text style={styles.storeBadge}>
            Via {Platform.OS === 'android' ? 'Google Play' : 'App Store'}
          </Text>
        )}
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
          disabled={restoring}
        />
        {Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={purchasing || restoring}
          >
            <RefreshCw color={COLORS.primary} size={18} />
            <Text style={styles.restoreButtonText}>
              {restoring ? 'Restauration...' : 'Restaurer mes achats'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={purchasing || restoring}
        >
          <Text style={styles.backButtonText}>Plus tard</Text>
        </TouchableOpacity>
      </View>

      {Platform.OS === 'web' && (
        <Text style={styles.disclaimer}>
          Note: Les achats in-app ne sont disponibles que sur les applications mobiles natives.
          Utilisez l'application Android ou iOS pour vous abonner.
        </Text>
      )}
      {Platform.OS !== 'web' && (
        <Text style={styles.disclaimer}>
          L'abonnement sera facturé via votre compte {Platform.OS === 'android' ? 'Google Play' : 'App Store'}.
          Gérez votre abonnement dans les paramètres de votre compte {Platform.OS === 'android' ? 'Google Play' : 'App Store'}.
        </Text>
      )}
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
  storeBadge: {
    fontSize: SIZES.xs,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    padding: SPACING.sm,
  },
  restoreButtonText: {
    fontSize: SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
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
