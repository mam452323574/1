import { TouchableOpacity, StyleSheet } from 'react-native';
import { LogOut } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function LogoutButton() {
  const { signOut } = useAuth();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    scale.value = withSequence(
      withSpring(0.85, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    await signOut();
  };

  return (
    <AnimatedTouchable
      style={[styles.container, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <LogOut color={COLORS.primaryText} size={24} strokeWidth={2} />
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    marginRight: 8,
  },
});
