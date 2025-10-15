import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { COLORS, SIZES, FONT_WEIGHTS } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  value: number;
  size?: number;
}

export function CircularProgress({ value, size = 140 }: CircularProgressProps) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withDelay(
      300,
      withTiming(value, {
        duration: 1500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const progress = ((100 - animatedValue.value) / 100) * circumference;
    return {
      strokeDashoffset: progress,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.lightGray}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.accentGreen}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>/100</Text>
        <Text style={styles.sublabel}>santé</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  value: {
    fontSize: SIZES.scoreNumber,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.secondaryText,
    lineHeight: SIZES.scoreNumber,
  },
  label: {
    fontSize: SIZES.scoreSub,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.gray,
    lineHeight: SIZES.scoreSub + 2,
  },
  sublabel: {
    fontSize: SIZES.scoreSub,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.gray,
    lineHeight: SIZES.scoreSub + 2,
  },
});
