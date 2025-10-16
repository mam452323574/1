import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, Award, Sparkles, Save } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { userProfile, updateUserProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    reminders: true,
    achievements: true,
    newContent: true,
  });

  useEffect(() => {
    if (userProfile?.notification_settings) {
      setSettings(userProfile.notification_settings);
    }
  }, [userProfile]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateUserProfile({
        notification_settings: settings,
      });

      Alert.alert(
        'Paramètres sauvegardés',
        'Vos préférences de notification ont été mises à jour avec succès.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert(
        'Erreur',
        'Impossible de sauvegarder vos paramètres. Veuillez réessayer.'
      );
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={styles.headerTitle}>Préférences Notifications</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Types de Notifications</Text>
          <Text style={styles.sectionDescription}>
            Choisissez les notifications que vous souhaitez recevoir
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Bell color={COLORS.primary} size={20} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Rappels</Text>
                <Text style={styles.settingDescription}>
                  Rappels de scans et de suivi quotidien
                </Text>
              </View>
            </View>
            <Switch
              value={settings.reminders}
              onValueChange={() => handleToggle('reminders')}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Award color={COLORS.primary} size={20} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Succès</Text>
                <Text style={styles.settingDescription}>
                  Notifications de jalons et accomplissements
                </Text>
              </View>
            </View>
            <Switch
              value={settings.achievements}
              onValueChange={() => handleToggle('achievements')}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Sparkles color={COLORS.primary} size={20} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Nouveau Contenu</Text>
                <Text style={styles.settingDescription}>
                  Nouvelles recettes, exercices et fonctionnalités
                </Text>
              </View>
            </View>
            <Switch
              value={settings.newContent}
              onValueChange={() => handleToggle('newContent')}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Les notifications vous aident à rester motivé et à suivre vos progrès.
            Vous pouvez les désactiver à tout moment.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Sauvegarder les préférences"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
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
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: SIZES.text14,
    color: COLORS.gray,
    marginBottom: SPACING.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primaryText,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: SIZES.text12,
    color: COLORS.gray,
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.page,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  infoText: {
    fontSize: SIZES.text14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.page,
    paddingVertical: SPACING.xl,
  },
});
