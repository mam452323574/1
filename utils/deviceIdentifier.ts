import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceInfo } from '@/types';

const DEVICE_ID_STORAGE_KEY = '@health_scan:device_identifier';

export async function getDeviceIdentifier(): Promise<string> {
  try {
    let storedId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);

    if (storedId) {
      console.log('[DeviceIdentifier] Using stored identifier');
      return storedId;
    }

    console.log('[DeviceIdentifier] No stored identifier, generating new one');
    const deviceId = await generateDeviceIdentifier();

    try {
      await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
      console.log('[DeviceIdentifier] New identifier saved successfully');
    } catch (storageError) {
      console.error('[DeviceIdentifier] Failed to save identifier to AsyncStorage:', storageError);
    }

    return deviceId;
  } catch (error) {
    console.error('[DeviceIdentifier] Error getting device identifier:', error);
    return await generateDeviceIdentifier();
  }
}

async function generateDeviceIdentifier(): Promise<string> {
  try {
    const platform = Platform.OS;
    const modelName = Device.modelName || 'unknown';
    const osVersion = Device.osVersion || 'unknown';
    const brand = Device.brand || 'unknown';

    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);

    const identifier = `${platform}-${brand}-${modelName}-${osVersion}-${timestamp}-${randomSuffix}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');

    console.log('[DeviceIdentifier] Generated new identifier:', identifier.substring(0, 30) + '...');
    return identifier;
  } catch (error) {
    console.error('[DeviceIdentifier] Error generating identifier:', error);
    const fallbackId = `fallback-${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    console.log('[DeviceIdentifier] Using fallback identifier');
    return fallbackId;
  }
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  try {
    const identifier = await getDeviceIdentifier();
    const platform = Platform.OS as 'ios' | 'android' | 'web';
    const modelName = Device.modelName || 'Unknown Device';
    const brand = Device.brand || '';

    const deviceName = brand && modelName
      ? `${brand} ${modelName}`
      : modelName || `${platform} Device`;

    console.log('[DeviceInfo] Device:', deviceName, 'Platform:', platform);

    return {
      device_identifier: identifier,
      device_name: deviceName,
      platform,
    };
  } catch (error) {
    console.error('[DeviceInfo] Error getting device info:', error);
    const fallbackIdentifier = await getDeviceIdentifier();
    return {
      device_identifier: fallbackIdentifier,
      device_name: `${Platform.OS} Device`,
      platform: Platform.OS as 'ios' | 'android' | 'web',
    };
  }
}

export async function clearDeviceIdentifier(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_STORAGE_KEY);
    console.log('[DeviceIdentifier] Device identifier cleared successfully');
  } catch (error) {
    console.error('[DeviceIdentifier] Error clearing device identifier:', error);
  }
}
