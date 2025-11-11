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
  const [loadingMessage, setLoadingMessage] = useState('Enregistrement...');
  const [showConfetti, setShowConfetti] = useState(false);
  const { setBadge } = useBadges();

  const handleConfirm = async () => {
    console.log('[ScanPreview] ========== START handleConfirm ==========');
    console.log('[ScanPreview] imageUri:', imageUri);
    console.log('[ScanPreview] scanType:', scanType);

    if (!imageUri || !scanType) {
      console.error('[ScanPreview] Missing required params!');
      Alert.alert('Erreur', 'Données manquantes pour le scan');
      return;
    }

    try {
      setLoading(true);
      console.log('[ScanPreview] Loading state set to true');

      if (scanType === 'nutrition') {
        setLoadingMessage('Analyse en cours...');
        console.log('[ScanPreview] Nutrition scan - loading message updated');
      } else {
        setLoadingMessage('Enregistrement en cours...');
      }

      console.log('[ScanPreview] ========== Calling ApiService.createScan ==========');
      const scanData = await ApiService.createScan(imageUri, scanType);
      console.log('[ScanPreview] ========== Scan created successfully ==========');
      console.log('[ScanPreview] Scan data:', JSON.stringify(scanData, null, 2));

      setShowConfetti(true);
      setBadge('analytics');
      console.log('[ScanPreview] Confetti triggered, badge set to analytics');

      setTimeout(() => {
        console.log('[ScanPreview] Timeout callback executing (1500ms delay)...');
        if (scanType === 'nutrition' && scanData.analysis_result) {
          console.log('[ScanPreview] Navigating to scan-results with analysis data');
          router.replace({
            pathname: '/scan-results',
            params: {
              imageUri: imageUri,
              analysisData: JSON.stringify(scanData.analysis_result),
            },
          });
        } else {
          console.log('[ScanPreview] Non-nutrition scan or no analysis result');
          console.log('[ScanPreview] Showing success alert and navigating to home');
          Alert.alert(
            'Succès',
            'Votre scan a bien été enregistré ! Consultez l\'onglet Analyses pour voir vos statistiques.',
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('[ScanPreview] User pressed OK, navigating to home tab');
                  router.replace('/(tabs)');
                },
              },
            ]
          );
        }
      }, 1500);
    } catch (err) {
      console.error('[ScanPreview] ========== ERROR in handleConfirm ==========');
      console.error('[ScanPreview] Error object:', err);
      console.error('[ScanPreview] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      console.error('[ScanPreview] Error message:', errorMessage);

      if (errorMessage.includes('Limite') || errorMessage.includes('atteinte') || errorMessage.includes('Prochain scan')) {
        console.log('[ScanPreview] Limit error detected, showing upgrade option');
        Alert.alert(
          'Limite atteinte',
          errorMessage,
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Passer à Premium',
              onPress: () => {
                console.log('[ScanPreview] User chose to upgrade to premium');
                router.push('/premium-plan');
              },
            },
          ]
        );
      } else {
        console.log('[ScanPreview] Generic error, showing error alert');
        Alert.alert('Erreur', errorMessage);
      }

      setLoading(false);
    }
    console.log('[ScanPreview] ========== END handleConfirm ==========');
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
          title={loading ? loadingMessage : 'Confirmer et Sauvegarder'}
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
