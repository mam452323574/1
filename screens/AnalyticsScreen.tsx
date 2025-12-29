import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { ApiService } from '@/services/api';
import { AnalyticsData } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<'7days' | '30days' | '90days'>('30days');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const analyticsData = await ApiService.getAnalytics(period);
      setData(analyticsData);
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

  if (!data || data.healthScoreHistory.length === 0) {
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

  const healthScoreSlice = data.healthScoreHistory.slice(-7);
  const calorieSlice = data.calorieHistory.slice(-7);
  const bodyCompositionSlice = data.bodyCompositionHistory.slice(-7);

  const healthScoreData = healthScoreSlice.length > 0 ? {
    labels: healthScoreSlice.map((item) => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: healthScoreSlice.map((item) => item.value),
      },
    ],
  } : null;

  const caloriesData = calorieSlice.length > 0 ? {
    labels: calorieSlice.map((item) => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: calorieSlice.map((item) => item.consumed),
      },
    ],
  } : null;

  const bodyCompositionData = bodyCompositionSlice.length > 0 ? {
    labels: bodyCompositionSlice.map((item) => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: bodyCompositionSlice.map((item) => item.bodyfat),
        color: () => COLORS.primary,
        strokeWidth: 2,
      },
      {
        data: bodyCompositionSlice.map((item) => item.muscle),
        color: () => COLORS.secondary,
        strokeWidth: 2,
      },
    ],
    legend: ['Masse Grasse %', 'Muscle %'],
  } : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>analyses</Text>
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

      {healthScoreData && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Score Sante</Text>
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

      {caloriesData && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Calories Consommees</Text>
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

      {bodyCompositionData && (
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.gray,
    textTransform: 'lowercase',
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
