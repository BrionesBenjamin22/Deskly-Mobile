import { Platform } from 'react-native';

const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const appEnvironment = process.env.EXPO_PUBLIC_APP_ENV?.trim().toLowerCase();

function getDefaultApiUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:3000';
  }

  return 'http://127.0.0.1:3000';
}

export function resolveApiBaseUrl(
  configuredUrl = envApiUrl,
  environment = appEnvironment,
): string {
  const apiUrl = (configuredUrl || getDefaultApiUrl()).replace(/\/$/, '');

  if (environment === 'production') {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(apiUrl);
    } catch {
      throw new Error('EXPO_PUBLIC_API_URL debe ser una URL valida.');
    }
    if (parsedUrl.protocol !== 'https:') {
      throw new Error('EXPO_PUBLIC_API_URL debe usar HTTPS en produccion.');
    }
  }

  return apiUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();
