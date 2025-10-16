import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, CheckCheck, Filter } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { NotificationCard } from '@/components/NotificationCard';
import { supabase } from '@/services/supabase';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

interface Notification {
  id: string;
  notification_type: 'achievement' | 'reminder' | 'newContent';
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { markNotificationAsRead } = useNotificationContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.is('read_at', null);
      } else if (filter === 'read') {
        query = query.not('read_at', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [filter]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      setMarkingAllAsRead(true);

      const { error } = await supabase
        .from('notification_logs')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;

      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const renderFilterButton = (filterType: FilterType, label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
      onPress={() => setFilter(filterType)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterType && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <CheckCheck color={COLORS.primary} size={64} />
      </View>
      <Text style={styles.emptyTitle}>Aucune notification</Text>
      <Text style={styles.emptyText}>
        {filter === 'unread'
          ? 'Vous avez tout lu ! Continuez votre suivi santé.'
          : 'Vous n\'avez pas encore de notifications.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft color={COLORS.primaryText} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
              disabled={markingAllAsRead}
              activeOpacity={0.7}
            >
              {markingAllAsRead ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <CheckCheck color={COLORS.primary} size={20} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'Toutes')}
        {renderFilterButton('unread', `Non lues (${unreadCount})`)}
        {renderFilterButton('read', 'Lues')}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <NotificationCard
              id={item.id}
              type={item.notification_type}
              title={item.title}
              body={item.body}
              createdAt={item.created_at}
              isRead={!!item.read_at}
              onMarkAsRead={() => handleMarkAsRead(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.page,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: SPACING.xs,
    width: 40,
  },
  headerTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  markAllButton: {
    padding: SPACING.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.page,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filterButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.gray,
  },
  filterButtonTextActive: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  listContent: {
    padding: SPACING.page,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    fontSize: SIZES.text20,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
