import { createHmac, timingSafeEqual } from 'node:crypto';
import { PaymentStatus } from '../../domain/entities/payment-attempt.entity';
import {
  InvalidWebhookSignatureError,
  PaymentGatewayError,
} from '../../domain/errors/payment-domain.errors';
import {
  CreateGatewayPaymentInput,
  CreateGatewayPaymentResult,
  GatewayNotification,
  GatewayPaymentExpectation,
  GatewayPaymentSnapshot,
  GatewayWebhookRequest,
  PaymentGatewayPort,
} from '../../domain/ports/payment-gateway.port';
import { MercadoPagoConfig } from './mercado-pago.config';

type HttpClient = typeof fetch;
type JsonObject = Record<string, unknown>;

export class MercadoPagoGateway implements PaymentGatewayPort {
  readonly provider = 'MERCADO_PAGO' as const;
  private readonly baseUrl = 'https://api.mercadopago.com';

  constructor(
    private readonly config: MercadoPagoConfig,
    private readonly http: HttpClient = fetch,
  ) {}

  async createPayment(
    input: CreateGatewayPaymentInput,
  ): Promise<CreateGatewayPaymentResult> {
    const response = await this.request('/checkout/preferences', {
      method: 'POST',
      idempotencyKey: input.idempotencyKey,
      body: {
        items: [
          {
            id: input.paymentId,
            title: input.description.slice(0, 120),
            quantity: 1,
            currency_id: input.currency,
            unit_price: input.amountMinorUnits / 100,
          },
        ],
        external_reference: input.externalReference,
        metadata: { payment_id: input.paymentId },
        back_urls: {
          success: this.config.successUrl,
          failure: this.config.failureUrl,
          pending: this.config.pendingUrl,
        },
        auto_return: 'approved',
        expires: true,
        expiration_date_to: input.expiresAt.toISOString(),
      },
    });
    const id = this.string(response, 'id');
    const checkoutUrl = this.string(
      response,
      this.config.production ? 'init_point' : 'sandbox_init_point',
    );
    this.assertCheckoutUrl(checkoutUrl);
    return {
      provider: this.provider,
      externalPaymentId: id,
      externalReference: input.externalReference,
      status: 'PENDING',
      amountMinorUnits: input.amountMinorUnits,
      currency: input.currency,
      occurredAt: new Date(),
      checkoutUrl,
      expiresAt: new Date(input.expiresAt),
    };
  }

  async getPayment(
    externalPaymentId: string,
    expectation?: GatewayPaymentExpectation,
  ): Promise<GatewayPaymentSnapshot> {
    const response = await this.request(
      `/v1/payments/${encodeURIComponent(externalPaymentId)}`,
      { method: 'GET' },
    );
    const snapshot = this.paymentSnapshot(response);
    if (
      expectation &&
      (snapshot.externalReference !== expectation.externalReference ||
        snapshot.amountMinorUnits !== expectation.amountMinorUnits ||
        snapshot.currency !== expectation.currency)
    )
      throw new PaymentGatewayError(
        'Los datos informados por el proveedor no coinciden con el pago.',
        false,
      );
    return snapshot;
  }

  async refundPayment(
    externalPaymentId: string,
    idempotencyKey: string,
  ): Promise<GatewayPaymentSnapshot> {
    await this.request(
      `/v1/payments/${encodeURIComponent(externalPaymentId)}/refunds`,
      { method: 'POST', idempotencyKey, body: {} },
    );
    return this.getPayment(externalPaymentId);
  }

  async verifyAndParseWebhook(
    request: GatewayWebhookRequest,
  ): Promise<GatewayNotification> {
    const signature = request.headers['x-signature'];
    const requestId = request.headers['x-request-id'];
    let body: unknown;
    try {
      body = JSON.parse(request.rawBody);
    } catch {
      throw new InvalidWebhookSignatureError();
    }
    const event = this.object(body);
    const data = this.object(event.data);
    const dataId = this.safeIdentifier(data.id);
    const eventId = this.safeIdentifier(event.id);
    const eventType = this.safeIdentifier(event.type);
    if (!signature || !requestId || !dataId || !eventId || !eventType)
      throw new InvalidWebhookSignatureError();
    const parts = Object.fromEntries(
      signature.split(',').map((part) => part.trim().split('=', 2)),
    );
    if (
      !/^\d{10,16}$/.test(parts.ts ?? '') ||
      !/^[a-f0-9]{64}$/i.test(parts.v1 ?? '')
    )
      throw new InvalidWebhookSignatureError();
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
    const expected = createHmac('sha256', this.config.webhookSecret)
      .update(manifest)
      .digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const actualBuffer = Buffer.from(parts.v1, 'hex');
    if (
      expectedBuffer.length !== actualBuffer.length ||
      !timingSafeEqual(expectedBuffer, actualBuffer)
    )
      throw new InvalidWebhookSignatureError();
    return { eventId, externalPaymentId: dataId, eventType };
  }

  private async request(
    path: string,
    options: {
      method: 'GET' | 'POST';
      idempotencyKey?: string;
      body?: JsonObject;
    },
  ): Promise<JsonObject> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.http(`${this.baseUrl}${path}`, {
        method: options.method,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          Accept: 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(options.idempotencyKey
            ? { 'X-Idempotency-Key': options.idempotencyKey }
            : {}),
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      });
      if (!response.ok)
        throw new PaymentGatewayError(
          'El proveedor de pagos no pudo completar la operacion.',
          response.status === 408 ||
            response.status === 429 ||
            response.status >= 500,
        );
      let json: unknown;
      try {
        json = await response.json();
      } catch {
        throw new PaymentGatewayError(
          'El proveedor de pagos devolvio una respuesta invalida.',
          false,
        );
      }
      return this.object(json);
    } catch (error) {
      if (
        error instanceof PaymentGatewayError ||
        (error instanceof Error && error.name === 'PaymentGatewayError')
      )
        throw error;
      throw new PaymentGatewayError(
        'No fue posible comunicarse con el proveedor de pagos.',
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private paymentSnapshot(value: JsonObject): GatewayPaymentSnapshot {
    const amount = Number(value.transaction_amount);
    const occurredAt = new Date(
      this.optionalString(value, 'date_last_updated') ??
        this.optionalString(value, 'date_created') ??
        '',
    );
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      Number.isNaN(occurredAt.getTime())
    )
      throw new PaymentGatewayError(
        'El proveedor de pagos devolvio una respuesta invalida.',
        false,
      );
    const currency = this.string(value, 'currency_id');
    if (currency !== 'ARS')
      throw new PaymentGatewayError(
        'La moneda informada por el proveedor no coincide.',
        false,
      );
    const externalPaymentId = this.safeIdentifier(value.id);
    if (!externalPaymentId)
      throw new PaymentGatewayError(
        'El proveedor de pagos devolvio una respuesta invalida.',
        false,
      );
    return {
      provider: this.provider,
      externalPaymentId,
      externalReference: this.string(value, 'external_reference'),
      status: this.mapStatus(this.string(value, 'status')),
      amountMinorUnits: Math.round(amount * 100),
      currency: 'ARS',
      occurredAt,
    };
  }

  private mapStatus(status: string): PaymentStatus {
    const statuses: Record<string, PaymentStatus> = {
      pending: 'PENDING',
      in_process: 'PROCESSING',
      authorized: 'PROCESSING',
      approved: 'APPROVED',
      rejected: 'REJECTED',
      cancelled: 'CANCELLED',
      refunded: 'REFUNDED',
      charged_back: 'REFUNDED',
      expired: 'EXPIRED',
    };
    return statuses[status.toLowerCase()] ?? 'PROCESSING';
  }

  private assertCheckoutUrl(value: string): void {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new PaymentGatewayError(
        'El proveedor devolvio un checkout invalido.',
        false,
      );
    }
    if (
      url.protocol !== 'https:' ||
      !/(^|\.)mercadopago\.com$/.test(url.hostname)
    )
      throw new PaymentGatewayError(
        'El proveedor devolvio un checkout invalido.',
        false,
      );
  }

  private object(value: unknown): JsonObject {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new PaymentGatewayError(
        'El proveedor de pagos devolvio una respuesta invalida.',
        false,
      );
    return value as JsonObject;
  }
  private string(value: JsonObject, key: string): string {
    const result = this.optionalString(value, key);
    if (!result)
      throw new PaymentGatewayError(
        'El proveedor de pagos devolvio una respuesta invalida.',
        false,
      );
    return result;
  }
  private optionalString(value: JsonObject, key: string): string | undefined {
    return typeof value[key] === 'string' && value[key].trim()
      ? value[key].trim()
      : undefined;
  }
  private safeIdentifier(value: unknown): string {
    const result =
      typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : '';
    return /^[A-Za-z0-9._:-]{1,160}$/.test(result) ? result : '';
  }
}
