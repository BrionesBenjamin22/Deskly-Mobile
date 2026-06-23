import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { Icon } from '../../../components/ui/Icon';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { StatusModal, StatusModalType } from '../../../components/ui/StatusModal';
import { colors, statusColors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { DesksFeedbackCard } from '../../desks/components/DesksFeedbackCard';
import { createPayment } from '../services/payments.service';
import { usePayments } from '../hooks/usePayments';
import { ReservationPaymentSummary } from '../types/payment.types';

type PaymentsScreenProps = {
  onPressDesks?: () => void;
  onPressReservations?: () => void;
  onPressSettings?: () => void;
  onPressLogout?: () => void;
  refreshKey?: number;
};

type PaymentActionStatus = 'idle' | 'loading' | 'success' | 'error';

const PRICE_PER_HOUR = 1500;

function timeToMinutes(value: string) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function calcularMontoTotal(startTime: string, endTime: string): number {
  if (!startTime || !endTime || startTime === '—' || endTime === '—') return 0;
  const diffMin = timeToMinutes(endTime) - timeToMinutes(startTime);
  return Math.round((Math.max(0, diffMin) / 60) * PRICE_PER_HOUR);
}

function formatMoneda(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getDeskLocation(deskCode: string): string | null {
  if (UUID_REGEX.test(deskCode) || deskCode === '—') return null;
  const zone = deskCode.charAt(0).toUpperCase();
  return ['A', 'B', 'C'].includes(zone) ? `Zona ${zone}` : deskCode;
}

function formatPaymentDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

type EstadoPago = 'pagado' | 'senado' | 'pendiente';

function getEstado(abonado: number, total: number): EstadoPago {
  if (total === 0) return 'pendiente';
  if (abonado >= total) return 'pagado';
  return 'senado';
}

function EstadoBadge({ estado }: { estado: EstadoPago }) {
  if (estado === 'pagado') {
    return (
      <View style={[styles.badge, styles.badgePagado]}>
        <Icon name="circleCheck" size={12} color={statusColors.success} />
        <AppText variant="caption" style={styles.badgePagadoText}>Pagado</AppText>
      </View>
    );
  }
  if (estado === 'senado') {
    return (
      <View style={[styles.badge, styles.badgeSenado]}>
        <Icon name="clock" size={12} color={statusColors.warning} />
        <AppText variant="caption" style={styles.badgeSenadoText}>Seña pagada</AppText>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgePendiente]}>
      <Icon name="clock" size={12} color={colors.blackOverlay} />
      <AppText variant="caption" style={styles.badgePendienteText}>Pendiente</AppText>
    </View>
  );
}

type PaymentCardProps = {
  summary: ReservationPaymentSummary;
  onPagarSaldo: (summary: ReservationPaymentSummary, montoPendiente: number) => void;
};

function PaymentCard({ summary, onPagarSaldo }: PaymentCardProps) {
  const montoTotal = calcularMontoTotal(summary.startTime, summary.endTime);
  const montoPendiente = Math.max(0, montoTotal - summary.totalAbonado);
  const estado = getEstado(summary.totalAbonado, montoTotal);
  const location = getDeskLocation(summary.deskCode);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <AppText variant="body" style={styles.deskName}>
            {summary.deskName}
          </AppText>
          {location ? (
            <View style={styles.cardMeta}>
              <Icon name="mapPin" size={14} color={colors.primaryLight} />
              <AppText variant="caption" color={colors.primaryLight}>
                {location}
              </AppText>
            </View>
          ) : null}
        </View>
        <EstadoBadge estado={estado} />
      </View>

      <View style={styles.cardMeta}>
        <Icon name="calendar" size={14} color={colors.primaryLight} />
        <AppText variant="caption" color={colors.blackOverlay}>
          {summary.reservationDateLabel}
        </AppText>
      </View>

      <View style={styles.amountBlock}>
        <View style={styles.amountRow}>
          <AppText variant="caption" color={colors.blackOverlay}>Monto total</AppText>
          <AppText variant="caption" style={styles.amountValue}>
            {formatMoneda(montoTotal)}
          </AppText>
        </View>
        <View style={styles.amountRow}>
          <AppText variant="caption" color={colors.blackOverlay}>Abonado</AppText>
          <AppText variant="caption" color={colors.blackOverlay}>
            {formatMoneda(summary.totalAbonado)}
          </AppText>
        </View>
        <View style={[styles.amountRow, styles.amountRowBorder]}>
          <AppText variant="caption" color={colors.blackOverlay}>Saldo pendiente</AppText>
          <AppText
            variant="caption"
            style={montoPendiente > 0 ? styles.pendientePositivo : styles.pendienteZero}
          >
            {formatMoneda(montoPendiente)}
          </AppText>
        </View>
      </View>

      {montoPendiente > 0 ? (
        <Button
          title={`Pagar saldo (${formatMoneda(montoPendiente)})`}
          onPress={() => onPagarSaldo(summary, montoPendiente)}
        >
          <Icon name="chevronRight" size={18} color={colors.white} />
        </Button>
      ) : (
        <AppText variant="caption" color={colors.primaryLight}>
          Registrado el {formatPaymentDate(summary.lastPaymentDate)}
        </AppText>
      )}
    </View>
  );
}

const paymentStatusContent: Record<
  Exclude<PaymentActionStatus, 'idle'>,
  { type: StatusModalType; title: string; description: string }
> = {
  loading: {
    type: 'loading',
    title: 'Procesando pago...',
    description: 'Estamos confirmando tu pago. Esto puede tomar unos segundos.',
  },
  success: {
    type: 'success',
    title: 'Pago confirmado',
    description: 'Tu saldo fue pagado correctamente.',
  },
  error: {
    type: 'error',
    title: 'No pudimos procesar el pago',
    description: 'Hubo un problema al procesar tu pago. Intenta nuevamente.',
  },
};

export function PaymentsScreen({
  onPressDesks,
  onPressReservations,
  onPressSettings,
  onPressLogout,
  refreshKey = 0,
}: PaymentsScreenProps) {
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const { summaries, isLoading, errorMessage } = usePayments(refreshKey + localRefreshKey);
  const [paymentStatus, setPaymentStatus] = useState<PaymentActionStatus>('idle');
  const [paymentErrorMessage, setPaymentErrorMessage] = useState(
    paymentStatusContent.error.description,
  );
  const [pendingPayment, setPendingPayment] = useState<{
    summary: ReservationPaymentSummary;
    monto: number;
  } | null>(null);

  const summariesConDeuda = summaries.filter((s) => {
    const montoTotal = calcularMontoTotal(s.startTime, s.endTime);
    return montoTotal - s.totalAbonado > 0;
  });

  const totalAbonado = summariesConDeuda.reduce((acc, s) => acc + s.totalAbonado, 0);
  const totalPendiente = summariesConDeuda.reduce((acc, s) => {
    const montoTotal = calcularMontoTotal(s.startTime, s.endTime);
    return acc + Math.max(0, montoTotal - s.totalAbonado);
  }, 0);

  const executePayment = async (
    summary: ReservationPaymentSummary,
    montoPendiente: number,
  ) => {
    setPaymentStatus('loading');
    setPaymentErrorMessage(paymentStatusContent.error.description);

    try {
      const today = new Date().toISOString().split('T')[0];
      await createPayment({
        reservationId: summary.reservationId,
        date: today,
        amount: montoPendiente,
      });

      setPaymentStatus('success');
      setTimeout(() => {
        setLocalRefreshKey((k) => k + 1);
        setPaymentStatus('idle');
      }, 1500);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No pudimos procesar el pago.';
      setPaymentErrorMessage(message);
      setPaymentStatus('error');
    }
  };

  const handlePagarSaldo = (
    summary: ReservationPaymentSummary,
    montoPendiente: number,
  ) => {
    setPendingPayment({ summary, monto: montoPendiente });
  };

  const handleConfirmPayment = () => {
    if (pendingPayment) {
      const { summary, monto } = pendingPayment;
      setPendingPayment(null);
      void executePayment(summary, monto);
    }
  };

  const activeStatus =
    paymentStatus === 'idle' ? null : paymentStatusContent[paymentStatus];

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <AppText variant="title">Pagos</AppText>
            <AppText variant="caption" color={colors.primaryLight} style={styles.count}>
              {summaries.length} pago{summaries.length !== 1 ? 's' : ''} registrado{summaries.length !== 1 ? 's' : ''}
            </AppText>
          </View>

          {!isLoading && summaries.length > 0 ? (
            totalPendiente > 0 ? (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statLabel}>
                    <Icon name="creditCard" size={16} color={colors.blackOverlay} />
                    <AppText variant="caption" color={colors.blackOverlay} style={styles.statLabelText}>
                      PENDIENTE A PAGAR
                    </AppText>
                  </View>
                  <AppText variant="subtitle" style={styles.statValue}>
                    {formatMoneda(totalPendiente)}
                  </AppText>
                </View>
              </View>
            ) : (
              <View style={styles.allPaidBanner}>
                <Icon name="circleCheck" size={20} color={statusColors.success} />
                <View style={styles.allPaidText}>
                  <AppText variant="body" style={styles.allPaidTitle}>
                    Todo al día
                  </AppText>
                  <AppText variant="caption" color={colors.primaryLight}>
                    No tenés deudas pendientes
                  </AppText>
                </View>
              </View>
            )
          ) : null}

          {isLoading ? (
            <DesksFeedbackCard
              icon="loader"
              title="Cargando pagos"
              description="Estamos consultando tus pagos en Deskly."
            />
          ) : errorMessage ? (
            <DesksFeedbackCard
              icon="circleAlert"
              title="No pudimos cargar tus pagos"
              description={errorMessage}
            />
          ) : summaries.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Icon name="wallet" size={32} color={colors.primaryLight} />
              </View>
              <AppText variant="body" color={colors.primaryLight} style={styles.emptyTitle}>
                No tienes pagos todavía
              </AppText>
              <AppText variant="caption" color={colors.primaryLight} style={styles.emptySubtitle}>
                Cada reserva genera un pago con su seña asociada
              </AppText>
            </View>
          ) : (
            <View style={styles.list}>
              {summaries.map((summary) => (
                <PaymentCard
                  key={summary.reservationId}
                  summary={summary}
                  onPagarSaldo={handlePagarSaldo}
                />
              ))}
            </View>
          )}
        </ScrollView>

        <BottomTabBar
          activeTab="payments"
          onPressDesks={onPressDesks}
          onPressReservations={onPressReservations}
          onPressSettings={onPressSettings}
          onPressLogout={onPressLogout}
        />
      </View>

      <ConfirmModal
        visible={pendingPayment !== null}
        title="¿Confirmar pago?"
        description={
          pendingPayment
            ? `¿Deseas pagar ${formatMoneda(pendingPayment.monto)} de tu saldo pendiente?`
            : undefined
        }
        confirmLabel="Confirmar pago"
        cancelLabel="Cancelar"
        icon="creditCard"
        onConfirm={handleConfirmPayment}
        onCancel={() => setPendingPayment(null)}
      />

      {activeStatus ? (
        <StatusModal
          visible
          type={activeStatus.type}
          title={activeStatus.title}
          description={
            paymentStatus === 'error' ? paymentErrorMessage : activeStatus.description
          }
          onClose={paymentStatus === 'loading' ? undefined : () => setPaymentStatus('idle')}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    gap: spacing.md,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  count: {
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  statLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statLabelText: {
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  statValue: {
    fontWeight: '800',
  },
  allPaidBanner: {
    alignItems: 'center',
    backgroundColor: statusColors.successSoft,
    borderColor: statusColors.success,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  allPaidText: {
    gap: 2,
  },
  allPaidTitle: {
    color: statusColors.success,
    fontWeight: '700',
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  deskName: {
    fontWeight: '700',
  },
  cardMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgePagado: {
    backgroundColor: statusColors.successSoft,
  },
  badgePagadoText: {
    color: statusColors.success,
    fontWeight: '600',
  },
  badgeSenado: {
    backgroundColor: '#FEF3C7',
  },
  badgeSenadoText: {
    color: statusColors.warning,
    fontWeight: '600',
  },
  badgePendiente: {
    backgroundColor: colors.background,
  },
  badgePendienteText: {
    color: colors.blackOverlay,
    fontWeight: '600',
  },
  amountBlock: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
  amountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountRowBorder: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  amountValue: {
    fontWeight: '700',
  },
  pendientePositivo: {
    fontWeight: '700',
  },
  pendienteZero: {
    color: statusColors.success,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  emptyTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});
