import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceInfo } from '@/types';

const DEVICE_ID_STORAGE_KEY = '@health_scan:device_identifier';

export async function getDeviceIdentifier(): Promise<string> {
  let storedId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);

  if (storedId) {
    return storedId;
  }

  const deviceId = await generateDeviceIdentifier();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}

async function generateDeviceIdentifier(): Promise<string> {
  const platform = Platform.OS;
  const modelName = Device.modelName || 'unknown';
  const osVersion = Device.osVersion || 'unknown';
  const brand = Device.brand || 'unknown';

  const randomSuffix = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);

  const identifier = `${platform}-${brand}-${modelName}-${osVersion}-${timestamp}-${randomSuffix}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');

  return identifier;
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  const identifier = await getDeviceIdentifier();
  const platform = Platform.OS as 'ios' | 'android' | 'web';
  const modelName = Device.modelName || 'Unknown Device';
  const brand = Device.brand || '';

  const deviceName = brand && modelName
    ? `${brand} ${modelName}`
    : modelName || `${platform} Device`;

  return {
    device_identifier: identifier,
    device_name: deviceName,
    platform,
  };
}

export async function clearDeviceIdentifier(): Promise<void> {
  await AsyncStorage.removeItem(DEVICE_ID_STORAGE_KEY);
}
