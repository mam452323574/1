import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Award, Bell, Sparkles, Clock } from 'lucide-react-native';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

interface NotificationCardProps {
  id: string;
  type: 'achievement' | 'reminder' | 'newContent';
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  onPress?: () => void;
  onMarkAsRead?: () => void;
}

export function NotificationCard({
  id,
  type,
  title,
  body,
  createdAt,
  isRead,
  onPress,
  onMarkAsRead,
}: NotificationCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'achievement':
        return <Award color={COLORS.primary} size={24} fill={COLORS.primary} />;
      case 'reminder':
        return <Bell color={COLORS.secondary} size={24} />;
      case 'newContent':
        return <Sparkles color={COLORS.accent} size={24} />;
      default:
        return <Bell color={COLORS.gray} size={24} />;
    }
  };

  const getBackgroundColor = () => {
    if (!isRead) {
      return '#F0F9FF';
    }
    return COLORS.white;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInMs = now.getTime() - then.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) {
      return "À l'instant";
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else if (diffInDays === 1) {
      return 'Hier';
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jours`;
    } else {
      return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        !isRead && styles.unreadContainer,
      ]}
      onPress={onPress || onMarkAsRead}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, !isRead && styles.unreadTitle]}>{title}</Text>
          {!isRead && <View style={styles.unreadBadge} />}
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {body}
        </Text>
        <View style={styles.footer}>
          <Clock color={COLORS.gray} size={14} />
          <Text style={styles.timestamp}>{getTimeAgo(createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  unreadContainer: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primaryText,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: FONT_WEIGHTS.bold,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  body: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  timestamp: {
    fontSize: SIZES.text12,
    color: COLORS.gray,
  },
});
