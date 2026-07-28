const ENV_FILE_SUFFIXES: Record<string, string> = {
  development: 'development',
  test: 'testing',
  testing: 'testing',
  production: 'production',
};

export function resolveEnvFilePaths(nodeEnv = process.env.NODE_ENV): string[] {
  const suffix = ENV_FILE_SUFFIXES[nodeEnv ?? 'development'] ?? nodeEnv;
  return [`.env.${suffix}.local`, `.env.${suffix}`, '.env.local', '.env'];
}
