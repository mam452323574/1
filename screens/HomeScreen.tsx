import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { UtensilsCrossed, Dumbbell } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { ApiService } from '@/services/api';
import { DashboardData, ScanEligibilityResponse, ScanType } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { CircularProgress } from '@/components/CircularProgress';
import { DailyStat } from '@/components/DailyStat';
import { ActionCard } from '@/components/ActionCard';
import { ProductCard } from '@/components/ProductCard';
import { ScanLimitIndicator } from '@/components/ScanLimitIndicator';
import { FadeInView } from '@/components/FadeInView';
import { SettingsCog } from '@/components/SettingsCog';
import { NotificationBell } from '@/components/NotificationBell';
import { SCAN_TYPE_LABELS } from '@/constants/scan';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { checkForAchievements } = useNotificationContext();
  const [data, setData] = useState<DashboardData | null>(null);
  const [scanEligibility, setScanEligibility] = useState<Record<ScanType, ScanEligibilityResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScanEligibility = async (): Promise<Record<ScanType, ScanEligibilityResponse>> => {
    const scanTypes: ScanType[] = ['body', 'health', 'nutrition'];
    const results: Record<ScanType, ScanEligibilityResponse> = {} as Record<ScanType, ScanEligibilityResponse>;

    for (const scanType of scanTypes) {
      try {
        results[scanType] = await ApiService.checkScanEligibility(scanType);
      } catch {
        results[scanType] = {
          success: false,
          allowed: false,
          message: 'Erreur de chargement',
        };
      }
    }
    return results;
  };

  const fetchData = async () => {
    try {
      setError(null);
      const [dashboardData, eligibility] = await Promise.all([
        ApiService.getDashboard(),
        fetchScanEligibility(),
      ]);
      setData(dashboardData);
      setScanEligibility(eligibility);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    checkForAchievements();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!data) {
    return <ErrorMessage message="Aucune donnée disponible" />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Health Scan</Text>
          <Text style={styles.username}>{userProfile?.username || 'Utilisateur'}</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell />
          <SettingsCog />
        </View>
      </View>

      <View style={styles.scoreSection}>
        <CircularProgress value={data.healthScore} />
      </View>

      <View style={styles.statsSection}>
        <DailyStat
          label="Calories"
          current={data.calories.current}
          goal={data.calories.goal}
          unit="kcal"
        />
        <DailyStat
          label="Bodyfat"
          current={data.bodyfat}
          goal={25}
          unit="%"
        />
      </View>

      <View style={styles.actionsSection}>
        <ActionCard
          title="nos recettes"
          icon={UtensilsCrossed}
          onPress={() => router.push('/recipes')}
        />
        <View style={{ width: SPACING.page }} />
        <ActionCard
          title="nos exercices"
          icon={Dumbbell}
          onPress={() => router.push('/exercises')}
        />
      </View>

      {scanEligibility && (
        <View style={styles.scanLimitsSection}>
          <Text style={styles.sectionTitle}>vos scans disponibles</Text>
          <View style={styles.scanLimitsGrid}>
            {(Object.keys(scanEligibility) as ScanType[]).map((scanType) => (
              <View key={scanType} style={styles.scanLimitCard}>
                <Text style={styles.scanLimitLabel}>
                  {SCAN_TYPE_LABELS[scanType]}
                </Text>
                <ScanLimitIndicator eligibility={scanEligibility[scanType]} />
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>nos compléments conseillés</Text>
        <FlatList
          data={data.recommendedProducts}
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 100}>
              <ProductCard product={item} />
            </FadeInView>
          )}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.cardBackground,
  },
  headerLeft: {
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  headerTitle: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.gray,
    textTransform: 'lowercase',
  },
  username: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.cardBackground,
    marginBottom: SPACING.block,
  },
  statsSection: {
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.block,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.block,
  },
  scanLimitsSection: {
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.block,
  },
  scanLimitsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  scanLimitCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  scanLimitLabel: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primaryText,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  productsSection: {
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.block,
    paddingBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: SIZES.text18,
    fontWeight: '700',
    color: COLORS.primaryText,
    marginBottom: SPACING.lg,
    textTransform: 'lowercase',
  },
});
