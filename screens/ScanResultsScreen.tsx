import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, TrendingUp } from 'lucide-react-native';
import { N8nAnalysisResponse } from '@/types';
import { Button } from '@/components/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

export default function ScanResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;
  const analysisData = params.analysisData as string;

  if (!analysisData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Aucune donnée d'analyse disponible</Text>
      </View>
    );
  }

  const analysis: N8nAnalysisResponse = JSON.parse(analysisData);

  const handleViewHistory = () => {
    router.replace('/(tabs)/analytics');
  };

  const handleClose = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <X color={COLORS.primaryText} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Résultats de l'Analyse</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </View>
        )}

        <View style={styles.totalsCard}>
          <Text style={styles.sectionTitle}>Totaux Nutritionnels</Text>

          <View style={styles.totalsGrid}>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{Math.round(analysis.totals.kcal)}</Text>
              <Text style={styles.totalLabel}>Calories</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{analysis.totals.protein_g.toFixed(1)}g</Text>
              <Text style={styles.totalLabel}>Protéines</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{analysis.totals.carb_g.toFixed(1)}g</Text>
              <Text style={styles.totalLabel}>Glucides</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{analysis.totals.fat_g.toFixed(1)}g</Text>
              <Text style={styles.totalLabel}>Lipides</Text>
            </View>
          </View>
        </View>

        {analysis.items && analysis.items.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Aliments Détectés</Text>

            {analysis.items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemNutrients}>
                  <View style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>Calories:</Text>
                    <Text style={styles.nutrientValue}>{Math.round(item.kcal)} kcal</Text>
                  </View>
                  <View style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>Protéines:</Text>
                    <Text style={styles.nutrientValue}>{item.protein_g.toFixed(1)}g</Text>
                  </View>
                  <View style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>Glucides:</Text>
                    <Text style={styles.nutrientValue}>{item.carb_g.toFixed(1)}g</Text>
                  </View>
                  <View style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>Lipides:</Text>
                    <Text style={styles.nutrientValue}>{item.fat_g.toFixed(1)}g</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            Votre photo a été analysée en toute sécurité. Elle n'est pas stockée sur nos serveurs d'analyse.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Voir l'Historique"
          onPress={handleViewHistory}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    paddingHorizontal: SPACING.page,
    paddingBottom: SPACING.page,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    borderRadius: BORDER_RADIUS.md,
  },
  totalsCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
    marginBottom: SPACING.lg,
  },
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  totalItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  totalValue: {
    fontSize: SIZES.text28,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  totalLabel: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
  },
  itemsSection: {
    padding: SPACING.page,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  itemName: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primaryText,
    marginBottom: SPACING.md,
  },
  itemNutrients: {
    gap: SPACING.sm,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutrientLabel: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
  },
  nutrientValue: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primaryText,
  },
  privacyNotice: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    margin: SPACING.page,
    borderRadius: BORDER_RADIUS.md,
  },
  privacyText: {
    fontSize: SIZES.text12,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    padding: SPACING.page,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  errorText: {
    fontSize: SIZES.text16,
    color: COLORS.error,
    textAlign: 'center',
    margin: SPACING.page,
  },
});
