import { View, StyleSheet, Dimensions } from 'react-native';
import { ScanType } from '@/types';
import { COLORS } from '@/constants/theme';

interface CameraGuideProps {
  scanType: ScanType | null;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const CORNER_SIZE = 30;
const CORNER_THICKNESS = 4;

export function CameraGuide({ scanType }: CameraGuideProps) {
  if (!scanType) return null;

  let width: number;
  let height: number;

  switch (scanType) {
    case 'nutrition':
      width = SCREEN_WIDTH * 0.7;
      height = width;
      break;
    case 'body':
      width = SCREEN_WIDTH * 0.6;
      height = SCREEN_HEIGHT * 0.75;
      break;
    case 'health':
      width = SCREEN_WIDTH * 0.5;
      height = SCREEN_HEIGHT * 0.45;
      break;
    default:
      return null;
  }

  return (
    <View style={[styles.guideContainer, { width, height }]}>
      <View style={[styles.cornerTopLeft, styles.corner]} />
      <View style={[styles.cornerTopRight, styles.corner]} />
      <View style={[styles.cornerBottomLeft, styles.corner]} />
      <View style={[styles.cornerBottomRight, styles.corner]} />
    </View>
  );
}

const styles = StyleSheet.create({
  guideContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -1 }, { translateY: -1 }],
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: COLORS.secondaryText,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: COLORS.secondaryText,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: COLORS.secondaryText,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: COLORS.secondaryText,
  },
});
