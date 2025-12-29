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
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const updateTimer = () => {
      const now = Date.now();
      const diff = nextAvailableDate - now;

      if (diff <= 0) {
        setTimeRemaining('');
        setIsAvailable(true);
        if (intervalId) clearInterval(intervalId);
        return;
      }

      setIsAvailable(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}j ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}min`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}min`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimer();
    const diff = nextAvailableDate - Date.now();
    const intervalMs = diff <= 120000 ? 1000 : 60000;
    intervalId = setInterval(updateTimer, intervalMs);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [nextAvailableDate]);

  if (isAvailable) {
    return (
      <View style={styles.container}>
        <Clock color={COLORS.success} size={14} strokeWidth={2} />
        <Text style={[styles.text, styles.availableText]}>
          {scanLabel} disponible
        </Text>
      </View>
    );
  }

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
  availableText: {
    color: COLORS.success,
  },
});
