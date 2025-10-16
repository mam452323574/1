import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Bell } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { navigationService } from '@/services/navigation';
import { COLORS, SIZES, FONT_WEIGHTS } from '@/constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function NotificationBell() {
  const { notificationCount } = useNotificationContext();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.85, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    rotation.value = withSequence(
      withSpring(-15, { damping: 8, stiffness: 300 }),
      withSpring(15, { damping: 8, stiffness: 300 }),
      withSpring(0, { damping: 8, stiffness: 300 })
    );
    navigationService.navigateToNotifications();
  };

  return (
    <AnimatedTouchable
      style={[styles.container, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Bell color={COLORS.primaryText} size={24} strokeWidth={2} />
      {notificationCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {notificationCount > 9 ? '9+' : notificationCount}
          </Text>
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    fontSize: SIZES.text10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});
