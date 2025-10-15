import { Tabs } from 'expo-router';
import { Home, LineChart, ScanLine } from 'lucide-react-native';
import { AnimatedTabBarIcon } from '@/components/AnimatedTabBarIcon';
import { SettingsCog } from '@/components/SettingsCog';
import { useBadges } from '@/contexts/BadgeContext';
import { COLORS } from '@/constants/theme';

export default function TabLayout() {
  const { badges } = useBadges();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerRight: () => <SettingsCog />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.lightGray,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ size, color, focused }) => (
            <AnimatedTabBarIcon
              IconComponent={Home}
              size={size}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analyses',
          tabBarIcon: ({ size, color, focused }) => (
            <AnimatedTabBarIcon
              IconComponent={LineChart}
              size={size}
              color={color}
              focused={focused}
              showBadge={badges.analytics}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ size, color, focused }) => (
            <AnimatedTabBarIcon
              IconComponent={ScanLine}
              size={size}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
