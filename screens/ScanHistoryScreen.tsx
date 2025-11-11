import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, ChevronRight } from 'lucide-react-native';
import { ApiService } from '@/services/api';
import { ScanHistoryItem, ScanType } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { SCAN_TYPE_LABELS } from '@/constants/scan';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

export default function ScanHistoryScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ScanType | 'all'>('all');
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      console.log('[ScanHistory] fetchHistory called with selectedType:', selectedType);
      setError(null);
      const scanType = selectedType === 'all' ? undefined : selectedType;
      console.log('[ScanHistory] Calling ApiService.getScanHistory...');
      const data = await ApiService.getScanHistory(scanType);
      console.log('[ScanHistory] Received scan history data:', data?.length || 0, 'items');
      setScans(data || []);
    } catch (err) {
      console.error('[ScanHistory] Error fetching history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
      console.error('[ScanHistory] Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('[ScanHistory] fetchHistory completed');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedType]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleScanPress = (scan: ScanHistoryItem) => {
    try {
      console.log('[ScanHistory] Scan pressed:', scan.id, scan.scan_type);
      if (scan.scan_type === 'nutrition' && scan.analysis_result) {
        console.log('[ScanHistory] Navigating to scan-detail...');
        router.push({
          pathname: '/scan-detail',
          params: {
            scanId: scan.id,
          },
        });
      } else {
        console.log('[ScanHistory] Scan not clickable - not nutrition or no analysis');
      }
    } catch (err) {
      console.error('[ScanHistory] Error in handleScanPress:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>historique</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedType('all')}
          >
            <Text style={[styles.filterText, selectedType === 'all' && styles.filterTextActive]}>
              Tous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === 'nutrition' && styles.filterButtonActive]}
            onPress={() => setSelectedType('nutrition')}
          >
            <Text style={[styles.filterText, selectedType === 'nutrition' && styles.filterTextActive]}>
              {SCAN_TYPE_LABELS.nutrition}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === 'body' && styles.filterButtonActive]}
            onPress={() => setSelectedType('body')}
          >
            <Text style={[styles.filterText, selectedType === 'body' && styles.filterTextActive]}>
              {SCAN_TYPE_LABELS.body}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === 'health' && styles.filterButtonActive]}
            onPress={() => setSelectedType('health')}
          >
            <Text style={[styles.filterText, selectedType === 'health' && styles.filterTextActive]}>
              {SCAN_TYPE_LABELS.health}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {scans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Clock color={COLORS.gray} size={48} />
            <Text style={styles.emptyText}>Aucun scan trouvé</Text>
            <Text style={styles.emptySubtext}>
              Commencez par scanner un repas pour suivre votre nutrition
            </Text>
          </View>
        ) : (
          <View style={styles.scanList}>
            {scans.map((scan) => (
              <TouchableOpacity
                key={scan.id}
                style={styles.scanCard}
                onPress={() => handleScanPress(scan)}
                disabled={scan.scan_type !== 'nutrition' || !scan.analysis_result}
              >
                <View style={styles.scanCardLeft}>
                  {scan.image_url && (
                    <Image source={{ uri: scan.image_url }} style={styles.scanImage} />
                  )}
                  <View style={styles.scanInfo}>
                    <Text style={styles.scanType}>{SCAN_TYPE_LABELS[scan.scan_type]}</Text>
                    <Text style={styles.scanDate}>{formatDate(scan.created_at)}</Text>
                    <Text style={styles.scanTime}>{formatTime(scan.created_at)}</Text>

                    {scan.scan_type === 'nutrition' && scan.analysis_result && scan.analysis_result.totals && (
                      <Text style={styles.scanCalories}>
                        {Math.round(scan.analysis_result.totals.kcal || 0)} kcal
                      </Text>
                    )}
                  </View>
                </View>

                {scan.scan_type === 'nutrition' && scan.analysis_result && (
                  <ChevronRight color={COLORS.gray} size={20} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
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
  filterContainer: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.page,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.gray,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xxxl,
  },
  emptyText: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primaryText,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  scanList: {
    padding: SPACING.page,
    gap: SPACING.md,
  },
  scanCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  scanCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scanImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
  },
  scanInfo: {
    flex: 1,
  },
  scanType: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primaryText,
    marginBottom: SPACING.xs,
  },
  scanDate: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
  },
  scanTime: {
    fontSize: SIZES.text12,
    color: COLORS.gray,
    marginTop: 2,
  },
  scanCalories: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
});
