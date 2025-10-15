import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { COLORS, SIZES, SPACING, FONT_WEIGHTS } from '@/constants/theme';

interface NextScanTimerProps {
  nextAvailableDate: number;
  scanLabel: string;
}

export function NextScanTimer({ nextAvailableDate, scanLabel }: NextScanTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = nextAvailableDate - now;

      if (diff <= 0) {
        setTimeRemaining('Disponible maintenant');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}j ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}min`);
      } else {
        setTimeRemaining(`${minutes}min`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [nextAvailableDate]);

  return (
    <View style={styles.container}>
      <Clock color={COLORS.gray} size={14} strokeWidth={2} />
      <Text style={styles.text}>
        {scanLabel} dans {timeRemaining}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  text: {
    fontSize: SIZES.text12,
    color: COLORS.gray,
    fontWeight: FONT_WEIGHTS.regular,
  },
});
