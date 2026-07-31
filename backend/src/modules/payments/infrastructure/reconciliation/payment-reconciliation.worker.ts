import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { ReconcileStalePaymentsUseCase } from '../../application/use-cases/reconcile-stale-payments.use-case';
import { PAYMENT_RECONCILIATION_CONFIG } from './payment-reconciliation.config';
import type { PaymentReconciliationConfig } from './payment-reconciliation.config';

@Injectable()
export class PaymentReconciliationWorker
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PaymentReconciliationWorker.name);
  private timer: NodeJS.Timeout | undefined;
  private inFlight = false;

  constructor(
    private readonly reconciliation: ReconcileStalePaymentsUseCase,
    @Inject(PAYMENT_RECONCILIATION_CONFIG)
    private readonly config: PaymentReconciliationConfig,
  ) {}

  onModuleInit(): void {
    if (!this.config.enabled) return;
    void this.runOnce();
    this.timer = setInterval(() => {
      void this.runOnce();
    }, this.config.intervalMs);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  async runOnce() {
    if (this.inFlight) {
      this.logger.warn('conciliacion omitida reason=already_in_flight');
      return null;
    }

    this.inFlight = true;
    try {
      return await this.reconciliation.execute({
        limit: this.config.limit,
        minAgeMinutes: this.config.minAgeMinutes,
      });
    } catch {
      this.logger.error('conciliacion automatica fallida');
      return null;
    } finally {
      this.inFlight = false;
    }
  }
}
