import { useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AnalyticsScreen from '@/screens/AnalyticsScreen';
import { useBadges } from '@/contexts/BadgeContext';

export default function AnalyticsTab() {
  const { clearBadge } = useBadges();

  useFocusEffect(() => {
    clearBadge('analytics');
  });

  return <AnalyticsScreen />;
}
