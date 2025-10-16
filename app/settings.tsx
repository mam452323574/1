import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Crown, ChevronRight, Shield, LogOut, Bell, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { AccountBadge } from '@/components/AccountBadge';
import { Button } from '@/components/Button';
import { ModalHandle } from '@/components/ModalHandle';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile, signOut } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    console.log('[Settings] handleSignOut called - button was clicked!');
    console.log('[Settings] signOut function exists:', !!signOut);
    console.log('[Settings] userProfile exists:', !!userProfile);

    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              console.log('[Settings] User confirmed sign out');

              console.log('[Settings] Step 1: Dismissing all modals');
              router.dismissAll();

              console.log('[Settings] Step 2: Waiting for modal animations to complete');
              await new Promise(resolve => setTimeout(resolve, 300));

              console.log('[Settings] Step 3: Calling signOut to clear authentication');
              await signOut();

              console.log('[Settings] Sign out complete - root layout will handle navigation');
            } catch (error) {
              console.error('[Settings] Sign out error:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion.');
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
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
      <ScrollView style={styles.scrollContent}>
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
          onPress={() => {}}
          activeOpacity={0.8}
        >
          <View style={styles.menuItemLeft}>
            <Bell color={COLORS.primaryText} size={20} />
            <Text style={styles.menuItemText}>Notifications</Text>
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
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => {
            console.log('[Settings] TouchableOpacity onPress triggered!');
            handleSignOut();
          }}
          activeOpacity={0.8}
          disabled={isSigningOut}
        >
          <View style={styles.signOutButtonContent}>
            {isSigningOut ? (
              <ActivityIndicator color={COLORS.error} size="small" />
            ) : (
              <LogOut color={COLORS.error} size={20} />
            )}
            <Text style={styles.signOutText}>
              {isSigningOut ? 'Déconnexion...' : 'Se Déconnecter'}
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
  dangerZone: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.page,
    marginBottom: SPACING.xl,
  },
  signOutButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    zIndex: 10,
    elevation: 5,
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
