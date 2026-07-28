import { Platform } from 'react-native';

const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const appEnvironment = process.env.EXPO_PUBLIC_APP_ENV?.trim().toLowerCase();

type AppPlatform = typeof Platform.OS;

function getDefaultApiUrl(platform: AppPlatform) {
  if (platform === 'web') {
    return 'http://127.0.0.1:3000';
  }

  throw new Error(
    'EXPO_PUBLIC_API_URL es obligatoria en un emulador o dispositivo fisico.',
  );
}

export function resolveApiBaseUrl(
  configuredUrl = envApiUrl,
  environment = appEnvironment,
  platform: AppPlatform = Platform.OS,
): string {
  const apiUrl = (configuredUrl || getDefaultApiUrl(platform)).replace(
    /\/+$/,
    '',
  );
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(apiUrl);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL debe ser una URL valida.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('EXPO_PUBLIC_API_URL debe usar HTTP o HTTPS.');
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error('EXPO_PUBLIC_API_URL no debe incluir credenciales.');
  }

  if (parsedUrl.search || parsedUrl.hash) {
    throw new Error('EXPO_PUBLIC_API_URL no debe incluir query ni fragmento.');
  }

  if (environment === 'production') {
    if (parsedUrl.protocol !== 'https:') {
      throw new Error('EXPO_PUBLIC_API_URL debe usar HTTPS en produccion.');
    }
  }

  return apiUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();
