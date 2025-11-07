import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { History } from 'lucide-react-native';
import { ApiService } from '@/services/api';
import { AnalyticsData, NutritionHistoryDataPoint } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<'7days' | '30days' | '90days'>('30days');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionHistoryDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsData, nutritionHistory] = await Promise.all([
        ApiService.getAnalytics(period),
        ApiService.getNutritionHistory(period),
      ]);
      setData(analyticsData);
      setNutritionData(nutritionHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const hasHealthData = data && data.healthScoreHistory.length > 0;
  const hasNutritionData = nutritionData && nutritionData.length > 0;

  if (!hasHealthData && !hasNutritionData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Commencez à scanner pour voir vos progrès!</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: COLORS.white,
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(30, 58, 43, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(66, 66, 66, ${opacity})`,
    style: {
      borderRadius: BORDER_RADIUS.lg,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: COLORS.primary,
    },
  };

  const healthScoreData = data ? {
    labels: data.healthScoreHistory.slice(-7).map((item) => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: data.healthScoreHistory.slice(-7).map((item) => item.value),
      },
    ],
  } : null;

  const caloriesData = data ? {
    labels: data.calorieHistory.slice(-7).map((item) => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: data.calorieHistory.slice(-7).map((item) => item.consumed),
      },
    ],
  } : null;

  const bodyCompositionData = data ? {
    labels: data.bodyCompositionHistory.slice(-7).map((item) => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: data.bodyCompositionHistory.slice(-7).map((item) => item.bodyfat),
        color: () => COLORS.primary,
        strokeWidth: 2,
      },
      {
        data: data.bodyCompositionHistory.slice(-7).map((item) => item.muscle),
        color: () => COLORS.secondary,
        strokeWidth: 2,
      },
    ],
    legend: ['Masse Grasse %', 'Muscle %'],
  } : null;

  const nutritionFatData = nutritionData.length > 0 ? {
    labels: nutritionData.slice(-7).map((item) => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: nutritionData.slice(-7).map((item) => item.fat_g),
      },
    ],
  } : null;

  const nutritionCaloriesData = nutritionData.length > 0 ? {
    labels: nutritionData.slice(-7).map((item) => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: nutritionData.slice(-7).map((item) => item.kcal),
      },
    ],
  } : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>analyses</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/scan-history')} style={styles.historyButton}>
          <History color={COLORS.primary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, period === '7days' && styles.periodButtonActive]}
          onPress={() => setPeriod('7days')}
        >
          <Text style={[styles.periodButtonText, period === '7days' && styles.periodButtonTextActive]}>
            7 jours
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === '30days' && styles.periodButtonActive]}
          onPress={() => setPeriod('30days')}
        >
          <Text style={[styles.periodButtonText, period === '30days' && styles.periodButtonTextActive]}>
            30 jours
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === '90days' && styles.periodButtonActive]}
          onPress={() => setPeriod('90days')}
        >
          <Text style={[styles.periodButtonText, period === '90days' && styles.periodButtonTextActive]}>
            3 mois
          </Text>
        </TouchableOpacity>
      </View>

      {hasHealthData && healthScoreData && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Score Santé</Text>
          <LineChart
            data={healthScoreData}
            width={screenWidth - SPACING.lg * 2}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {hasHealthData && caloriesData && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Calories Consommées</Text>
          <BarChart
            data={caloriesData}
            width={screenWidth - SPACING.lg * 2}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>
      )}

      {hasHealthData && bodyCompositionData && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Composition Corporelle</Text>
          <LineChart
            data={bodyCompositionData}
            width={screenWidth - SPACING.lg * 2}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {hasNutritionData && nutritionCaloriesData && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Calories Nutritionnelles</Text>
          <LineChart
            data={nutritionCaloriesData}
            width={screenWidth - SPACING.lg * 2}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {hasNutritionData && nutritionFatData && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Lipides Consommés (g)</Text>
          <LineChart
            data={nutritionFatData}
            width={screenWidth - SPACING.lg * 2}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}
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
    backgroundColor: COLORS.white,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.gray,
    textTransform: 'lowercase',
  },
  historyButton: {
    padding: SPACING.xs,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  chartSection: {
    padding: SPACING.lg,
  },
  chartTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  emptyText: {
    fontSize: SIZES.lg,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
