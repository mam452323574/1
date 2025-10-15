import { TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LucideIcon } from 'lucide-react-native';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';

interface ActionCardProps {
  title: string;
  icon: LucideIcon;
  onPress: () => void;
}

export function ActionCard({ title, icon: Icon, onPress }: ActionCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 300,
    });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        <Icon color={COLORS.secondaryText} size={48} strokeWidth={2} />
        <Text style={styles.title}>{title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    flex: 1,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.none,
  },
  title: {
    fontSize: SIZES.text16,
    color: COLORS.secondaryText,
    fontWeight: FONT_WEIGHTS.semiBold,
    textAlign: 'center',
    marginTop: SPACING.card,
    textTransform: 'lowercase',
  },
});
