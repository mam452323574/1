import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Updates from 'expo-updates';
import { Crown, ChevronRight, Shield, LogOut, Bell, ChevronLeft, AlertTriangle, Settings } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { AccountBadge } from '@/components/AccountBadge';
import { Button } from '@/components/Button';
import { ModalHandle } from '@/components/ModalHandle';
import { navigationService } from '@/services/navigation';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile, signOut } = useAuth();
  const { notificationCount } = useNotificationContext();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    console.log('[Settings] Screen mounted, resetting isSigningOut state');
    setIsSigningOut(false);

    const timeout = setTimeout(() => {
      if (isSigningOut) {
        console.warn('[Settings] isSigningOut was stuck, force resetting to false');
        setIsSigningOut(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isSigningOut) {
      const resetTimeout = setTimeout(() => {
        console.warn('[Settings] Sign out took too long, resetting state');
        setIsSigningOut(false);
      }, 15000);
      return () => clearTimeout(resetTimeout);
    }
  }, [isSigningOut]);

  const handleNotificationsPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigationService.navigateToNotifications();
  };

  const handleNotificationSettingsPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/notification-settings');
  };

  const handleSignOut = async () => {
    console.log('[Settings] handleSignOut called, isSigningOut:', isSigningOut);

    if (isSigningOut) {
      console.log('[Settings] Already signing out, ignoring click');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      console.log('[Settings] Showing sign out confirmation dialog');
      Alert.alert(
        '⚠️ Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?\n\nVos données seront sauvegardées et vous pourrez vous reconnecter à tout moment.',
        [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => {
              console.log('[Settings] Sign out cancelled by user');
            },
          },
          {
            text: 'Se Déconnecter',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('[Settings] User confirmed sign out');
                setIsSigningOut(true);

                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                }

                console.log('[Settings] Step 1: Calling signOut to cleanup all data');
                await signOut();

                console.log('[Settings] Step 2: Forcing app reload');
                await Updates.reloadAsync();

              } catch (error) {
                console.error('[Settings] Sign out error:', error);
                setIsSigningOut(false);
                Alert.alert(
                  'Erreur',
                  'Une erreur est survenue lors de la déconnexion. Veuillez réessayer.',
                  [
                    {
                      text: 'OK',
                    },
                  ]
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('[Settings] Error in handleSignOut:', error);
      setIsSigningOut(false);
    }
  };

  if (!userProfile) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ModalHandle />
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ChevronLeft color={COLORS.primaryText} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
      >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {userProfile.avatar_url ? (
            <Image source={{ uri: userProfile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {userProfile.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>{userProfile.username}</Text>
        <Text style={styles.email}>{userProfile.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon Abonnement</Text>
        <View style={styles.subscriptionCard}>
          <AccountBadge tier={userProfile.account_tier} size="large" />
          {userProfile.account_tier === 'free' && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/premium-plan')}
              activeOpacity={0.8}
            >
              <Crown color={COLORS.primary} size={20} />
              <Text style={styles.upgradeButtonText}>Voir les avantages Premium</Text>
              <ChevronRight color={COLORS.primary} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleNotificationsPress}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <Bell color={COLORS.primaryText} size={20} />
            <View>
              <Text style={styles.menuItemText}>Notifications</Text>
              {notificationCount > 0 && (
                <Text style={styles.menuItemSubtext}>
                  {notificationCount} nouvelle{notificationCount > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.menuItemRight}>
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
              </View>
            )}
            <ChevronRight color={COLORS.gray} size={20} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleNotificationSettingsPress}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <Settings color={COLORS.primaryText} size={20} />
            <Text style={styles.menuItemText}>Préférences de notifications</Text>
          </View>
          <ChevronRight color={COLORS.gray} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/privacy-policy')}
          activeOpacity={0.8}
        >
          <View style={styles.menuItemLeft}>
            <Shield color={COLORS.primaryText} size={20} />
            <Text style={styles.menuItemText}>Politique de Confidentialité</Text>
          </View>
          <ChevronRight color={COLORS.gray} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.dangerZone}>
        <View style={styles.dangerZoneHeader}>
          <AlertTriangle color={COLORS.error} size={20} />
          <Text style={styles.dangerZoneTitle}>Zone Dangereuse</Text>
        </View>
        <Text style={styles.dangerZoneDescription}>
          Cette action vous déconnectera de votre compte. Vos données seront conservées.
        </Text>
        <TouchableOpacity
          style={[styles.signOutButton, isSigningOut && styles.signOutButtonDisabled]}
          onPress={handleSignOut}
          onPressIn={() => console.log('[Settings] Button pressed in')}
          onPressOut={() => console.log('[Settings] Button pressed out')}
          activeOpacity={0.7}
          disabled={isSigningOut}
        >
          <View style={styles.signOutButtonContent}>
            {isSigningOut ? (
              <ActivityIndicator color={COLORS.error} size="small" />
            ) : (
              <LogOut color={COLORS.error} size={22} strokeWidth={2.5} />
            )}
            <Text style={styles.signOutText}>
              {isSigningOut ? 'Déconnexion en cours...' : 'Se Déconnecter'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Health Scan v1.0.0</Text>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
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
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: SPACING.xxxl + SPACING.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  avatarContainer: {
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  username: {
    fontSize: SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.page,
  },
  sectionTitle: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
    marginBottom: SPACING.md,
  },
  subscriptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.button,
    backgroundColor: COLORS.background,
    marginTop: SPACING.sm,
  },
  upgradeButtonText: {
    fontSize: SIZES.text14,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuItemText: {
    fontSize: SIZES.text16,
    color: COLORS.primaryText,
    fontWeight: FONT_WEIGHTS.regular,
  },
  menuItemSubtext: {
    fontSize: SIZES.text12,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: FONT_WEIGHTS.medium,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  notificationBadge: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 22,
    height: 22,
    paddingHorizontal: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: SIZES.text12,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  dangerZone: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
    marginHorizontal: SPACING.page,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#FFF5F5',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#FFCCCC',
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  dangerZoneTitle: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.error,
  },
  dangerZoneDescription: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  signOutButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.error,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
    position: 'relative',
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: SIZES.text12,
    color: COLORS.gray,
  },
});
