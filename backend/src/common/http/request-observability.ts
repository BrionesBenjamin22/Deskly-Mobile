import { randomUUID } from 'node:crypto';

const CORRELATION_ID = /^[A-Za-z0-9._:-]{8,80}$/;

export function resolveCorrelationId(value: string | undefined): string {
  return value && CORRELATION_ID.test(value) ? value : randomUUID();
}

export function sanitizeHttpPath(originalUrl: string): string {
  const path = originalUrl.split('?', 1)[0] || '/';
  const sanitized = path
    .replace(/[\r\n\t]/g, '')
    .split('/')
    .map((segment) => {
      if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment)) return ':id';
      if (/^\d{6,}$/.test(segment) || segment.length > 80) return ':value';
      return segment.replace(/[^A-Za-z0-9._~:@!$&'()*+,;=-]/g, '_');
    })
    .join('/');
  return sanitized || '/';
}
