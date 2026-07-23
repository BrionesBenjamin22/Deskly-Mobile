import { resolveEnvFilePaths } from './env-files';

describe('resolveEnvFilePaths', () => {
  it.each([
    ['development', 'development'],
    ['test', 'testing'],
    ['testing', 'testing'],
    ['production', 'production'],
  ])('resuelve %s con el sufijo %s', (nodeEnv, suffix) => {
    expect(resolveEnvFilePaths(nodeEnv)).toEqual([
      `.env.${suffix}.local`,
      `.env.${suffix}`,
      '.env.local',
      '.env',
    ]);
  });

  it('usa development cuando NODE_ENV no esta definido', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    try {
      expect(resolveEnvFilePaths()).toEqual([
        '.env.development.local',
        '.env.development',
        '.env.local',
        '.env',
      ]);
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });
});
