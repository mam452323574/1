import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Bone, Brain, Heart, Sparkles } from 'lucide-react-native';
import { Product } from '@/types';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';

interface ProductCardProps {
  product: Product;
}

const benefitIcons: { [key: string]: any } = {
  'Soutien Ossature': Bone,
  'Santé Cognitive': Brain,
  'Santé Cardiovasculaire': Heart,
  'Antioxydant': Sparkles,
};

export function ProductCard({ product }: ProductCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    Linking.openURL(product.shopUrl);
  };

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
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
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.benefitsContainer}>
            {product.benefits.map((benefit, index) => {
              const IconComponent = benefitIcons[benefit] || Sparkles;
              return (
                <View key={index} style={styles.benefitRow}>
                  <IconComponent color={COLORS.secondaryText} size={16} strokeWidth={2} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.card,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    ...SHADOWS.none,
  },
  image: {
    width: '30%',
    backgroundColor: COLORS.lightGray,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  name: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.secondaryText,
    marginBottom: SPACING.card,
  },
  benefitsContainer: {
    gap: SPACING.benefit,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  benefitText: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.secondaryText,
  },
});
