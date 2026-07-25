import { resolveApiBaseUrl } from './api';

describe('resolveApiBaseUrl', () => {
  it('permite HTTP durante el desarrollo local', () => {
    expect(
      resolveApiBaseUrl('http://192.168.1.10:3000/', 'development'),
    ).toBe('http://192.168.1.10:3000');
  });

  it('exige HTTPS en produccion', () => {
    expect(() =>
      resolveApiBaseUrl('http://api.deskly.test', 'production'),
    ).toThrow('HTTPS');
    expect(
      resolveApiBaseUrl('https://api.deskly.test/', 'production'),
    ).toBe('https://api.deskly.test');
  });
});
