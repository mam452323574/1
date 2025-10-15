import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, User } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';

interface AvatarPickerProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onAvatarSelected: (url: string) => void;
  size?: number;
}

const DEFAULT_AVATAR = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200';

export function AvatarPicker({ userId, currentAvatarUrl, onAvatarSelected, size = 120 }: AvatarPickerProps) {
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const displayAvatar = localUri || currentAvatarUrl || DEFAULT_AVATAR;

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    return cameraStatus === 'granted' && libraryStatus === 'granted';
  };

  const compressImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    if (blob.size > 5 * 1024 * 1024) {
      throw new Error('Image trop volumineuse. Maximum 5MB.');
    }

    return uri;
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);

      const compressedUri = await compressImage(uri);

      const response = await fetch(compressedUri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setLocalUri(publicUrl);
      onAvatarSelected(publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de télécharger la photo');
    } finally {
      setUploading(false);
    }
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie photo');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const showOptions = () => {
    Alert.alert(
      'Photo de profil',
      'Choisissez une option',
      [
        {
          text: 'Prendre une photo',
          onPress: takePhoto,
        },
        {
          text: 'Choisir de la galerie',
          onPress: pickImageFromLibrary,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.avatarContainer, { width: size, height: size }]}
        onPress={showOptions}
        disabled={uploading}
      >
        <Image
          source={{ uri: displayAvatar }}
          style={[styles.avatar, { width: size, height: size }]}
        />
        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.white} />
          </View>
        )}
        {!uploading && (
          <View style={styles.editBadge}>
            <Camera color={COLORS.white} size={16} />
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.hint}>Appuyez pour modifier</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    borderRadius: 1000,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.primary,
    position: 'relative',
  },
  avatar: {
    borderRadius: 1000,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  hint: {
    marginTop: SPACING.sm,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
});
