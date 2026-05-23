type EnvironmentVariables = {
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URL: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
};

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const requiredVariables = ['DATABASE_URL', 'JWT_SECRET'] as const;

  for (const variable of requiredVariables) {
    if (!config[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
  }

  const getString = (key: string, fallback?: string): string => {
    const value = config[key] ?? fallback;

    if (typeof value !== 'string') {
      throw new Error(`Invalid environment variable: ${key}`);
    }

    return value;
  };

  return {
    NODE_ENV: getString('NODE_ENV', 'development'),
    PORT: Number(config.PORT ?? 3000),
    FRONTEND_URL: getString('FRONTEND_URL', 'http://localhost:5173'),
    DATABASE_URL: getString('DATABASE_URL'),
    JWT_SECRET: getString('JWT_SECRET'),
    JWT_EXPIRES_IN: getString('JWT_EXPIRES_IN', '1d'),
  };
}
