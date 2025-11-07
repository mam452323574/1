import { useEffect, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
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

function StaticTabBarIcon({
  IconComponent,
  color,
  size,
  focused,
  onPress,
  showBadge = false,
}: AnimatedTabBarIconProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.iconContainer}>
        <IconComponent color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
        {showBadge && <View style={styles.badge} />}
      </View>
    </Pressable>
  );
}

export function AnimatedTabBarIcon(props: AnimatedTabBarIconProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <StaticTabBarIcon {...props} />;
  }

  return <AnimatedTabBarIconInner {...props} onError={() => setHasError(true)} />;
}

function AnimatedTabBarIconInner({
  IconComponent,
  color,
  size,
  focused,
  onPress,
  showBadge = false,
  onError,
}: AnimatedTabBarIconProps & { onError: () => void }) {
  const scale = useSharedValue(1);
  const badgeScale = useSharedValue(showBadge ? 1 : 0);

  useEffect(() => {
    try {
      badgeScale.value = withSpring(showBadge ? 1 : 0, {
        damping: 15,
        stiffness: 150,
      });
    } catch (error) {
      console.error('[AnimatedTabBarIcon] Animation error:', error);
      onError();
    }
  }, [showBadge]);

  const animatedStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [{ scale: scale.value }],
      };
    } catch (error) {
      console.error('[AnimatedTabBarIcon] Animated style error:', error);
      runOnJS(onError)();
      return { transform: [{ scale: 1 }] };
    }
  });

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [{ scale: badgeScale.value }],
      };
    } catch (error) {
      console.error('[AnimatedTabBarIcon] Badge animated style error:', error);
      runOnJS(onError)();
      return { transform: [{ scale: showBadge ? 1 : 0 }] };
    }
  });

  const handlePressIn = () => {
    try {
      scale.value = withTiming(0.9, { duration: 100 });
    } catch (error) {
      console.error('[AnimatedTabBarIcon] Press in error:', error);
      onError();
    }
  };

  const handlePressOut = () => {
    try {
      scale.value = withSpring(1, {
        damping: 10,
        stiffness: 300,
      });
    } catch (error) {
      console.error('[AnimatedTabBarIcon] Press out error:', error);
      onError();
    }
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
