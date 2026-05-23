import { Platform } from 'react-native';

const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

function getDefaultApiUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:3000';
  }

  return 'http://127.0.0.1:3000';
}

export const API_BASE_URL = (envApiUrl || getDefaultApiUrl()).replace(/\/$/, '');
