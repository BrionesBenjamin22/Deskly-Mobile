import { Platform } from 'react-native';

const envApiUrl = process.env.EXPO_PUBLIC_API_URL;

function getDefaultApiUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}

export const API_BASE_URL = envApiUrl ?? getDefaultApiUrl();
