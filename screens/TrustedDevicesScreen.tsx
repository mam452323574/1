import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Smartphone, Trash2, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { TrustedDevice } from '@/types';

export default function TrustedDevicesScreen() {
  const router = useRouter();
  const { getTrustedDevices, removeTrustedDevice } = useAuth();
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const devicesData = await getTrustedDevices();
      setDevices(devicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des appareils');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (device: TrustedDevice) => {
    Alert.alert(
      'Supprimer cet appareil ?',
      `Vous devrez entrer un code de vérification la prochaine fois que vous vous connecterez depuis ${device.device_name || 'cet appareil'}.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTrustedDevice(device.id);
              await loadDevices();
            } catch (err) {
              Alert.alert(
                'Erreur',
                err instanceof Error ? err.message : 'Impossible de supprimer cet appareil'
              );
            }
          },
        },
      ]
    );
  };

  const handleRemoveAllDevices = () => {
    Alert.alert(
      'Supprimer tous les appareils ?',
      'Vous devrez entrer un code de vérification la prochaine fois que vous vous connecterez depuis n\'importe quel appareil.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const device of devices) {
                await removeTrustedDevice(device.id);
              }
              await loadDevices();
            } catch (err) {
              Alert.alert(
                'Erreur',
                err instanceof Error ? err.message : 'Impossible de supprimer les appareils'
              );
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const daysUntilExpiry = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return 'Éxpiré';
    } else if (daysUntilExpiry === 0) {
      return 'Expire aujourd\'hui';
    } else if (daysUntilExpiry === 1) {
      return 'Expire demain';
    } else {
      return `Expire dans ${daysUntilExpiry} jours`;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft color={COLORS.darkGray} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appareils de confiance</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft color={COLORS.darkGray} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appareils de confiance</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Les appareils de confiance ne nécessitent pas de code de vérification pendant 30 jours.
              Vous pouvez supprimer n'importe quel appareil à tout moment pour renforcer la sécurité.
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {devices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Smartphone color={COLORS.gray} size={64} />
              <Text style={styles.emptyTitle}>Aucun appareil de confiance</Text>
              <Text style={styles.emptyText}>
                Cochez "Faire confiance à cet appareil" lors de votre prochaine connexion pour ajouter un appareil.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.devicesContainer}>
                {devices.map((device, index) => (
                  <View key={device.id} style={styles.deviceCard}>
                    <View style={styles.deviceIcon}>
                      <Smartphone color={COLORS.primary} size={24} />
                    </View>
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>
                        {device.device_name || `Appareil ${index + 1}`}
                      </Text>
                      <Text style={styles.devicePlatform}>
                        {device.platform.charAt(0).toUpperCase() + device.platform.slice(1)}
                      </Text>
                      <Text style={styles.deviceDate}>
                        Ajouté le {formatDate(device.created_at)}
                      </Text>
                      <Text style={[
                        styles.deviceExpiry,
                        new Date(device.trusted_until) < new Date() && styles.deviceExpiryExpired
                      ]}>
                        {formatExpiryDate(device.trusted_until)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveDevice(device)}
                    >
                      <Trash2 color={COLORS.error} size={20} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {devices.length > 1 && (
                <Button
                  title="Supprimer tous les appareils"
                  onPress={handleRemoveAllDevices}
                  style={styles.removeAllButton}
                />
              )}
            </>
          )}
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.sm,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 22,
  },
  devicesContainer: {
    marginBottom: SPACING.lg,
  },
  deviceCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  devicePlatform: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  deviceDate: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
  },
  deviceExpiry: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  deviceExpiryExpired: {
    color: COLORS.error,
  },
  removeButton: {
    padding: SPACING.sm,
  },
  removeAllButton: {
    marginTop: SPACING.md,
  },
});
