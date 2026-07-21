import {
  resolveCorrelationId,
  sanitizeHttpPath,
} from './request-observability';

describe('observabilidad HTTP segura', () => {
  it('elimina query strings, controles e identificadores sensibles', () => {
    expect(
      sanitizeHttpPath(
        '/webhooks/payments/550e8400-e29b-41d4-a716-446655440000?x-signature=secret\nforged',
      ),
    ).toBe('/webhooks/payments/:id');
  });

  it('acepta correlation IDs acotados y reemplaza valores invalidos', () => {
    expect(resolveCorrelationId('request-1234')).toBe('request-1234');
    expect(resolveCorrelationId('secret\nforged')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f-]{27,}$/,
    );
  });
});
