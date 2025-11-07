import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Trash2, Share2 } from 'lucide-react-native';
import { ApiService } from '@/services/api';
import { Scan } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/Button';
import { SCAN_TYPE_LABELS } from '@/constants/scan';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

export default function ScanDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scanId = params.scanId as string;
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchScanDetail();
  }, [scanId]);

  const fetchScanDetail = async () => {
    try {
      const data = await ApiService.getScanById(scanId);
      setScan(data);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger les détails du scan');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le scan',
      'Êtes-vous sûr de vouloir supprimer ce scan ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await ApiService.deleteScan(scanId);
              Alert.alert('Succès', 'Le scan a été supprimé', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (err) {
              Alert.alert('Erreur', 'Impossible de supprimer le scan');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!scan) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Scan introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X color={COLORS.primaryText} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du Scan</Text>
        <TouchableOpacity onPress={handleDelete} disabled={deleting}>
          <Trash2 color={COLORS.error} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {scan.image_url && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: scan.image_url }} style={styles.image} />
          </View>
        )}

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Type</Text>
            <Text style={styles.metaValue}>{SCAN_TYPE_LABELS[scan.scan_type]}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatDate(scan.created_at)}</Text>
          </View>
        </View>

        {scan.scan_type === 'nutrition' && scan.analysis_result && (
          <>
            <View style={styles.totalsCard}>
              <Text style={styles.sectionTitle}>Totaux Nutritionnels</Text>

              <View style={styles.totalsGrid}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{Math.round(scan.analysis_result.totals.kcal)}</Text>
                  <Text style={styles.totalLabel}>Calories</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{scan.analysis_result.totals.protein_g.toFixed(1)}g</Text>
                  <Text style={styles.totalLabel}>Protéines</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{scan.analysis_result.totals.carb_g.toFixed(1)}g</Text>
                  <Text style={styles.totalLabel}>Glucides</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{scan.analysis_result.totals.fat_g.toFixed(1)}g</Text>
                  <Text style={styles.totalLabel}>Lipides</Text>
                </View>
              </View>
            </View>

            {scan.analysis_result.items && scan.analysis_result.items.length > 0 && (
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Aliments Détectés</Text>

                {scan.analysis_result.items.map((item, index) => (
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
          </>
        )}
      </ScrollView>
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
    height: 250,
    resizeMode: 'contain',
    borderRadius: BORDER_RADIUS.md,
  },
  metaCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
  },
  metaValue: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primaryText,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.md,
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
  errorText: {
    fontSize: SIZES.text16,
    color: COLORS.error,
    textAlign: 'center',
    margin: SPACING.page,
  },
});
