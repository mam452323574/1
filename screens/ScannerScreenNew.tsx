import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, FlipHorizontal, Image as ImageIcon, Crown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CameraGuide } from '@/components/CameraGuide';
import { NextScanTimer } from '@/components/NextScanTimer';
import { ApiService } from '@/services/api';
import { ScanType, ScanEligibilityResponse } from '@/types';
import { SCAN_TYPE_LABELS, FREE_SCAN_LIMITS, PREMIUM_SCAN_LIMITS } from '@/constants/scan';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

interface ScanEligibilityState {
  [key: string]: ScanEligibilityResponse | null;
}

export default function ScannerScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedScanType, setSelectedScanType] = useState<ScanType | null>(null);
  const [scanEligibility, setScanEligibility] = useState<ScanEligibilityState>({});
  const [loading, setLoading] = useState(true);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    checkAllScanEligibility();
    const interval = setInterval(checkAllScanEligibility, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkAllScanEligibility = async () => {
    try {
      const scanTypes: ScanType[] = ['body', 'health', 'nutrition'];
      const results: ScanEligibilityState = {};

      for (const scanType of scanTypes) {
        try {
          const result = await ApiService.checkScanEligibility(scanType);
          results[scanType] = result;
        } catch (error) {
          console.error(`Error checking ${scanType} eligibility:`, error);
          results[scanType] = null;
        }
      }

      setScanEligibility(results);
    } catch (err) {
      console.error('Error checking scan eligibility:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanTypeSelect = async (scanType: ScanType) => {
    const eligibility = scanEligibility[scanType];

    if (!eligibility || !eligibility.allowed) {
      if (eligibility && eligibility.next_available_date) {
        const nextDate = new Date(eligibility.next_available_date);
        const now = new Date();
        const diffMs = nextDate.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        let timeMessage = '';
        if (diffDays > 0) {
          timeMessage = `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
          timeMessage = `${diffHours} heure${diffHours > 1 ? 's' : ''}`;
        } else {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          timeMessage = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
        }

        Alert.alert(
          'Limite atteinte',
          `${eligibility.message} ${timeMessage}.\n\nPassez à Premium pour 3 scans par jour !`,
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Voir Premium',
              onPress: () => router.push('/premium-plan'),
            },
          ]
        );
      }
      return;
    }

    setSelectedScanType(scanType);
  };

  const takePicture = async () => {
    if (!selectedScanType) {
      Alert.alert('Type de scan requis', 'Veuillez sélectionner un type de scan avant de capturer');
      return;
    }

    setCheckingEligibility(true);
    try {
      const eligibility = await ApiService.checkScanEligibility(selectedScanType);

      if (!eligibility.allowed) {
        Alert.alert(
          'Limite atteinte',
          eligibility.message || 'Vous avez atteint la limite pour ce type de scan',
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Voir Premium',
              onPress: () => router.push('/premium-plan'),
            },
          ]
        );
        return;
      }

      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          router.push({
            pathname: '/scan-preview',
            params: {
              imageUri: photo.uri,
              scanType: selectedScanType,
            },
          });
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de vérifier l\'éligibilité du scan');
    } finally {
      setCheckingEligibility(false);
    }
  };

  const pickImage = async () => {
    if (!selectedScanType) {
      Alert.alert('Type de scan requis', 'Veuillez sélectionner un type de scan avant de choisir une image');
      return;
    }

    setCheckingEligibility(true);
    try {
      const eligibility = await ApiService.checkScanEligibility(selectedScanType);

      if (!eligibility.allowed) {
        Alert.alert(
          'Limite atteinte',
          eligibility.message || 'Vous avez atteint la limite pour ce type de scan',
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Voir Premium',
              onPress: () => router.push('/premium-plan'),
            },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        router.push({
          pathname: '/scan-preview',
          params: {
            imageUri: result.assets[0].uri,
            scanType: selectedScanType,
          },
        });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de vérifier l\'éligibilité du scan');
    } finally {
      setCheckingEligibility(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const renderScanTypeButton = (scanType: ScanType) => {
    const isSelected = selectedScanType === scanType;
    const eligibility = scanEligibility[scanType];
    const isDisabled = eligibility ? !eligibility.allowed : false;
    const isPremium = userProfile?.account_tier === 'premium';
    const limits = isPremium ? PREMIUM_SCAN_LIMITS : FREE_SCAN_LIMITS;
    const limit = limits[scanType];

    return (
      <View key={scanType} style={styles.scanTypeContainer}>
        <TouchableOpacity
          style={[
            styles.scanTypeButton,
            isSelected && styles.scanTypeButtonSelected,
            isDisabled && styles.scanTypeButtonDisabled,
          ]}
          onPress={() => handleScanTypeSelect(scanType)}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          <Text style={[styles.scanTypeText, isSelected && styles.scanTypeTextSelected]}>
            {SCAN_TYPE_LABELS[scanType]}
          </Text>
          <Text style={styles.limitLabel}>{limit.label}</Text>
          {eligibility && (
            <Text style={styles.countLabel}>
              {eligibility.current_count || 0}/{eligibility.limit || limit.count}
            </Text>
          )}
        </TouchableOpacity>
        {isDisabled && eligibility?.next_available_date && (
          <NextScanTimer
            nextAvailableDate={eligibility.next_available_date}
            scanLabel="Disponible"
          />
        )}
      </View>
    );
  };

  if (!permission || loading) {
    return <LoadingSpinner />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Camera color={COLORS.primary} size={64} />
        <Text style={styles.permissionText}>Nous avons besoin d'accéder à votre caméra</Text>
        <Button title="Autoriser" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.cameraHeader}>
          <Text style={styles.cameraTitle}>Scanner</Text>
        </View>

        <View style={styles.scanTypeSelector}>
          {renderScanTypeButton('health')}
          {renderScanTypeButton('body')}
          {renderScanTypeButton('nutrition')}
        </View>

        {userProfile?.account_tier === 'free' && (
          <TouchableOpacity
            style={styles.upgradePrompt}
            onPress={() => router.push('/premium-plan')}
            activeOpacity={0.8}
          >
            <Crown color={COLORS.primary} size={20} fill={COLORS.primary} />
            <Text style={styles.upgradePromptText}>
              Passez à Premium pour 3 scans par jour de chaque type
            </Text>
          </TouchableOpacity>
        )}

        <CameraGuide scanType={selectedScanType} />

        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.sideButton}
            onPress={pickImage}
            activeOpacity={0.8}
            disabled={checkingEligibility}
          >
            <ImageIcon color={COLORS.secondaryText} size={24} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            activeOpacity={0.8}
            disabled={checkingEligibility}
          >
            <View style={styles.captureButtonOuter}>
              <View style={styles.captureButtonInner} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideButton}
            onPress={toggleCameraFacing}
            activeOpacity={0.8}
          >
            <FlipHorizontal color={COLORS.secondaryText} size={24} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.page,
    backgroundColor: COLORS.background,
  },
  permissionText: {
    fontSize: SIZES.text16,
    color: COLORS.primaryText,
    textAlign: 'center',
    marginVertical: SPACING.xl,
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    paddingTop: SPACING.xxxl,
    paddingHorizontal: SPACING.page,
    paddingBottom: SPACING.sm,
  },
  cameraTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.secondaryText,
  },
  scanTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.page,
    paddingVertical: SPACING.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanTypeContainer: {
    alignItems: 'center',
  },
  scanTypeButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.button,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 100,
    alignItems: 'center',
  },
  scanTypeButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  scanTypeButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.5,
  },
  scanTypeText: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.secondaryText,
    textAlign: 'center',
  },
  scanTypeTextSelected: {
    color: COLORS.white,
  },
  limitLabel: {
    fontSize: SIZES.text10,
    color: COLORS.gray,
    marginTop: 2,
    textAlign: 'center',
  },
  countLabel: {
    fontSize: SIZES.text10,
    color: COLORS.secondaryText,
    marginTop: 2,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.page,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.button,
    gap: SPACING.xs,
  },
  upgradePromptText: {
    fontSize: SIZES.text12,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
    flex: 1,
    textAlign: 'center',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.cardBackground,
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonOuter: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 3,
    borderColor: COLORS.secondaryText,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.secondaryText,
  },
});
