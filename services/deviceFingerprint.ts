import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FINGERPRINT_STORAGE_KEY = '@healthscan_device_fingerprint';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function generateFingerprint(): Promise<string> {
  const components: string[] = [];

  components.push(Platform.OS);
  components.push(Platform.Version?.toString() || 'unknown');

  if (Platform.OS !== 'web') {
    components.push(Device.brand || 'unknown');
    components.push(Device.modelName || 'unknown');
    components.push(Device.osName || 'unknown');
    components.push(Device.osVersion || 'unknown');
  } else {
    if (typeof navigator !== 'undefined') {
      components.push(navigator.userAgent || 'unknown');
      components.push(navigator.language || 'unknown');
      components.push(screen?.width?.toString() || 'unknown');
      components.push(screen?.height?.toString() || 'unknown');
    }
  }

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  components.push(appVersion);

  const uniqueId = generateUUID();
  components.push(uniqueId);

  const fingerprintString = components.join('|');
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `${Platform.OS}-${Math.abs(hash).toString(16)}-${uniqueId.substring(0, 8)}`;
}

export async function getDeviceFingerprint(): Promise<string> {
  try {
    const storedFingerprint = await AsyncStorage.getItem(FINGERPRINT_STORAGE_KEY);

    if (storedFingerprint) {
      return storedFingerprint;
    }

    const newFingerprint = await generateFingerprint();
    await AsyncStorage.setItem(FINGERPRINT_STORAGE_KEY, newFingerprint);

    return newFingerprint;
  } catch (error) {
    console.error('[DeviceFingerprint] Error:', error);
    return await generateFingerprint();
  }
}

export function getDeviceName(): string {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      if (ua.includes('Chrome')) return 'Chrome Browser';
      if (ua.includes('Firefox')) return 'Firefox Browser';
      if (ua.includes('Safari')) return 'Safari Browser';
      if (ua.includes('Edge')) return 'Edge Browser';
      return 'Web Browser';
    }
    return 'Web Browser';
  }

  const brand = Device.brand || '';
  const model = Device.modelName || '';
  const osName = Device.osName || Platform.OS;
  const osVersion = Device.osVersion || Platform.Version;

  if (brand && model) {
    return `${brand} ${model} (${osName} ${osVersion})`;
  }

  return `${osName} ${osVersion}`;
}

export async function clearDeviceFingerprint(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FINGERPRINT_STORAGE_KEY);
  } catch (error) {
    console.error('[DeviceFingerprint] Error clearing:', error);
  }
}
