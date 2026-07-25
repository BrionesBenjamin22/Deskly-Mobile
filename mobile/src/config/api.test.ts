import { resolveApiBaseUrl } from './api';

describe('resolveApiBaseUrl', () => {
  it('usa loopback solo para web local sin configuracion', () => {
    expect(resolveApiBaseUrl('', 'development', 'web')).toBe(
      'http://127.0.0.1:3000',
    );
  });

  it('exige una URL explicita en Android e iOS', () => {
    expect(() => resolveApiBaseUrl('', 'development', 'android')).toThrow(
      'dispositivo',
    );
    expect(() => resolveApiBaseUrl('', 'development', 'ios')).toThrow(
      'dispositivo',
    );
  });

  it('permite declarar Android Emulator de forma explicita', () => {
    expect(
      resolveApiBaseUrl('http://10.0.2.2:3000', 'development', 'android'),
    ).toBe('http://10.0.2.2:3000');
  });

  it('permite una IP LAN explicita para un dispositivo fisico', () => {
    expect(
      resolveApiBaseUrl('http://192.168.1.10:3000/', 'development', 'android'),
    ).toBe('http://192.168.1.10:3000');
  });

  it('exige HTTPS en produccion', () => {
    expect(() =>
      resolveApiBaseUrl('http://api.deskly.test', 'production', 'android'),
    ).toThrow('HTTPS');
    expect(
      resolveApiBaseUrl('https://api.deskly.test/', 'production', 'android'),
    ).toBe('https://api.deskly.test');
  });

  it('rechaza URLs invalidas o con datos no propios de una base', () => {
    expect(() =>
      resolveApiBaseUrl('api.deskly.test', 'development', 'web'),
    ).toThrow('URL valida');
    expect(() =>
      resolveApiBaseUrl(
        'https://usuario:clave@api.deskly.test',
        'production',
        'web',
      ),
    ).toThrow('credenciales');
    expect(() =>
      resolveApiBaseUrl(
        'https://api.deskly.test?destino=otro',
        'production',
        'web',
      ),
    ).toThrow('query');
  });
});
