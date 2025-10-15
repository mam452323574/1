import { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { ApiService } from '@/services/api';
import { Button } from '@/components/Button';
import { SuccessConfetti } from '@/components/SuccessConfetti';
import { useBadges } from '@/contexts/BadgeContext';
import { ScanType } from '@/types';
import { SCAN_TYPE_LABELS } from '@/constants/scan';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

export default function ScanPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;
  const scanType = params.scanType as ScanType;
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { setBadge } = useBadges();

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await ApiService.createScan(imageUri, scanType);
      setShowConfetti(true);
      setBadge('analytics');

      setTimeout(() => {
        Alert.alert('Succès', 'Votre scan a bien été enregistré', [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)'),
          },
        ]);
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      Alert.alert('Erreur', errorMessage);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SuccessConfetti active={showConfetti} onAnimationEnd={() => setShowConfetti(false)} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X color={COLORS.primaryText} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choisir l'analyse</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />
      </View>

      <View style={styles.buttonsContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Type de scan</Text>
          <Text style={styles.infoValue}>{SCAN_TYPE_LABELS[scanType]}</Text>
        </View>

        <Button
          title={loading ? 'Enregistrement...' : 'Confirmer et Sauvegarder'}
          onPress={handleConfirm}
          disabled={loading}
        />

        {!loading && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        )}
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
  },
  headerTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.page,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  buttonsContainer: {
    padding: SPACING.page,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.card,
    borderTopRightRadius: BORDER_RADIUS.card,
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
  },
  cancelButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: SIZES.text16,
    color: COLORS.gray,
  },
});
