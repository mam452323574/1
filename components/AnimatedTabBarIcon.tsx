import { useEffect } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

interface AnimatedTabBarIconProps {
  IconComponent: LucideIcon;
  color: string;
  size: number;
  focused: boolean;
  onPress?: () => void;
  showBadge?: boolean;
}

export function AnimatedTabBarIcon({
  IconComponent,
  color,
  size,
  focused,
  onPress,
  showBadge = false,
}: AnimatedTabBarIconProps) {
  const scale = useSharedValue(1);
  const badgeScale = useSharedValue(showBadge ? 1 : 0);

  useEffect(() => {
    badgeScale.value = withSpring(showBadge ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [showBadge]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: badgeScale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 300,
    });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.container}
    >
      <Animated.View style={[animatedStyle, styles.iconContainer]}>
        <IconComponent color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
        {showBadge && (
          <Animated.View style={[styles.badge, badgeAnimatedStyle]} />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error || '#FF3B30',
    borderWidth: 2,
    borderColor: COLORS.white || '#FFFFFF',
  },
});
