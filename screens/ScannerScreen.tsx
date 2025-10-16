import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, FlipHorizontal, Image as ImageIcon } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CameraGuide } from '@/components/CameraGuide';
import { ApiService } from '@/services/api';
import { ScanType, ScanLimitStatus } from '@/types';
import { SCAN_TYPE_LABELS, MAX_SCANS_PER_TYPE } from '@/constants/scan';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

export default function ScannerScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedScanType, setSelectedScanType] = useState<ScanType | null>(null);
  const [scanLimits, setScanLimits] = useState<Record<ScanType, ScanLimitStatus> | null>(null);
  const [loading, setLoading] = useState(true);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    fetchScanLimits();
  }, []);

  const fetchScanLimits = async () => {
    try {
      const limits = await ApiService.getScanLimits();
      setScanLimits(limits);
    } catch (err) {
      console.error('Error fetching scan limits:', err);
    } finally {
      setLoading(false);
    }
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

  const takePicture = async () => {
    if (!selectedScanType) {
      Alert.alert('Type de scan requis', 'Veuillez sélectionner un type de scan avant de capturer');
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
  };

  const pickImage = async () => {
    if (!selectedScanType) {
      Alert.alert('Type de scan requis', 'Veuillez sélectionner un type de scan avant de choisir une image');
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
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleScanTypeSelect = (scanType: ScanType) => {
    if (scanLimits && scanLimits[scanType].isLimitReached) {
      return;
    }
    setSelectedScanType(scanType);
  };

  const renderScanTypeButton = (scanType: ScanType) => {
    const isSelected = selectedScanType === scanType;
    const isDisabled = scanLimits ? scanLimits[scanType].isLimitReached : false;

    return (
      <TouchableOpacity
        key={scanType}
        style={[
          styles.scanTypeButton,
          isSelected && styles.scanTypeButtonSelected,
          isDisabled && styles.scanTypeButtonDisabled,
        ]}
        onPress={() => handleScanTypeSelect(scanType)}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.scanTypeText,
          isSelected && styles.scanTypeTextSelected,
          isDisabled && styles.scanTypeTextDisabled,
        ]}>
          {SCAN_TYPE_LABELS[scanType]}
        </Text>
        {isDisabled && (
          <Text style={styles.limitText}>Limite atteinte</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>scanner</Text>
      </View>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <CameraGuide scanType={selectedScanType} />

        <View style={styles.controlsOverlay}>
          <View style={styles.scanTypeSelector}>
            {renderScanTypeButton('body')}
            {renderScanTypeButton('health')}
            {renderScanTypeButton('nutrition')}
          </View>

          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.sideButton} onPress={pickImage} activeOpacity={0.8}>
              <ImageIcon color={COLORS.white} size={28} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture} activeOpacity={0.8}>
              <View style={styles.captureButtonOuter}>
                <View style={styles.captureButtonInner} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideButton} onPress={toggleCameraFacing} activeOpacity={0.8}>
              <FlipHorizontal color={COLORS.white} size={28} strokeWidth={2} />
            </TouchableOpacity>
          </View>
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
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.page,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerTitle: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
    textTransform: 'lowercase',
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
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingBottom: SPACING.xl,
  },
  scanTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  scanTypeButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    minWidth: 90,
    alignItems: 'center',
  },
  scanTypeButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  scanTypeButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scanTypeText: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  scanTypeTextSelected: {
    color: COLORS.white,
  },
  scanTypeTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  limitText: {
    fontSize: SIZES.text12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
  },
  sideButton: {
    width: 52,
    height: 52,
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
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 4,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
  },
});
