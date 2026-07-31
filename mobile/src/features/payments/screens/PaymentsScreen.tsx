import { useRef, useState } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "../../../components/ui/AppText";
import { BottomTabBar } from "../../../components/ui/BottomTabBar";
import { useAuth } from "../../auth/context/AuthContext";
import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { ScreenContainer } from "../../../components/ui/ScreenContainer";
import { StatusModal } from "../../../components/ui/StatusModal";
import { colors, statusColors } from "../../../theme/colors";
import { radii, spacing } from "../../../theme/spacing";
import { usePullToRefresh } from "../../../hooks/usePullToRefresh";
import { DesksFeedbackCard } from "../../desks/components/DesksFeedbackCard";
import { PaymentQuoteModal } from "../components/PaymentQuoteModal";
import { usePayments } from "../hooks/usePayments";
import {
  createPaymentCheckout,
  createPaymentOperationKey,
  getPaymentAttempt,
  getPaymentQuote,
  PaymentServiceError,
} from "../services/payments.service";
import type {
  PaymentOption,
  PaymentQuote,
  PaymentReservationItem,
  PaymentStatus,
  PaymentSummaryFilter,
} from "../types/payment.types";

type PaymentsScreenProps = {
  onPressDesks?: () => void;
  onPressReservations?: () => void;
  onPressSettings?: () => void;
  onPressProfile?: () => void;
  onPressLogout?: () => void;
  onPressSwitchAccount?: () => void;
  onPressUserManagement?: () => void;
  onPressChangePassword?: () => void;
  refreshKey?: number;
};

const TERMINAL_STATUSES: PaymentStatus[] = [
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
];

const statusLabels: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
  EXPIRED: "Vencido",
  REFUNDED: "Reembolsado",
};

const paymentFilters: Array<{
  label: string;
  value: PaymentSummaryFilter;
}> = [
  { label: "Todos", value: "ALL" },
  { label: "Pendientes", value: "PENDING" },
  { label: "Completados", value: "COMPLETED" },
];

function formatMoney(minorUnits: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(minorUnits / 100);
}

export function PaymentsScreen(props: PaymentsScreenProps) {
  const { accessToken } = useAuth();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<PaymentSummaryFilter>("ALL");
  const [localRefresh, setLocalRefresh] = useState(0);
  const { items, totalPages, isLoading, errorMessage, reload } = usePayments(
    accessToken,
    page,
    (props.refreshKey ?? 0) + localRefresh,
    filter,
  );
  const pullToRefresh = usePullToRefresh(reload);
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [busyReservation, setBusyReservation] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "loading" | "success" | "error";
    title: string;
    description: string;
    canContinueInBackground?: boolean;
  } | null>(null);
  const operationKeys = useRef(new Map<string, string>());
  const waitingInBackground = useRef(false);
  const totalPending = items.reduce(
    (total, item) => total + item.pendingMinorUnits,
    0,
  );

  const requestQuote = async (reservationId: string) => {
    setBusyReservation(reservationId);
    try {
      setQuote(await getPaymentQuote(accessToken, reservationId));
    } catch (error) {
      showError(error);
    } finally {
      setBusyReservation(null);
    }
  };

  const startCheckout = async (option: PaymentOption) => {
    if (!quote) return;
    const operationId = `${quote.reservationId}:${option}`;
    const idempotencyKey =
      operationKeys.current.get(operationId) ?? createPaymentOperationKey();
    operationKeys.current.set(operationId, idempotencyKey);
    waitingInBackground.current = false;
    setBusyReservation(quote.reservationId);
    setFeedback({
      type: "loading",
      title: "Abriendo pago seguro",
      description: "Estamos preparando el checkout. No cierre la aplicacion.",
    });
    try {
      const checkout = await createPaymentCheckout(accessToken, {
        reservationId: quote.reservationId,
        option,
        idempotencyKey,
      });
      const url = new URL(checkout.checkoutUrl);
      if (url.protocol !== "https:")
        throw new PaymentServiceError("URL de pago invalida.");
      await Linking.openURL(checkout.checkoutUrl);
      setQuote(null);
      setFeedback({
        type: "loading",
        title: "Esperando confirmacion",
        description:
          "Consultamos el estado informado por Deskly. Puede seguir usando la aplicacion y le avisaremos si se aprueba.",
        canContinueInBackground: true,
      });
      const status = await pollPayment(
        accessToken,
        checkout.paymentId,
        checkout.expiresAt,
      );
      setLocalRefresh((value) => value + 1);
      if (status === "APPROVED") {
        operationKeys.current.delete(operationId);
        setFeedback({
          type: "success",
          title: "Pago confirmado",
          description: "Deskly verifico el pago y actualizo la reserva.",
        });
      } else if (!waitingInBackground.current) {
        setFeedback({
          type: "error",
          title: status ? statusLabels[status] : "Pago aun pendiente",
          description:
            "No existe una aprobacion confirmada. Puede actualizar el estado o reintentar.",
        });
      }
    } catch (error) {
      if (!waitingInBackground.current) showError(error);
    } finally {
      waitingInBackground.current = false;
      setBusyReservation(null);
    }
  };

  const showError = (error: unknown) => {
    const known =
      error instanceof PaymentServiceError ||
      (error instanceof Error && error.name === "PaymentServiceError");
    setFeedback({
      type: "error",
      title: "No pudimos procesar el pago",
      description: known
        ? (error as Error).message
        : "Lo sentimos, ocurrio un problema. Intente nuevamente.",
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView
          testID="payments-scroll"
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={() => void pullToRefresh.onRefresh()}
              refreshing={pullToRefresh.isRefreshing}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.header}>
            <AppText variant="title">Pagos</AppText>
            <AppText
              variant="caption"
              color={colors.primaryLight}
              style={styles.count}
            >
              {items.length} pago{items.length === 1 ? "" : "s"} registrado
              {items.length === 1 ? "" : "s"}
            </AppText>
          </View>
          {!isLoading && items.length > 0 ? (
            <View style={styles.statCard}>
              <View style={styles.statLabel}>
                <Icon name="creditCard" size={16} color={colors.blackOverlay} />
                <AppText variant="caption" color={colors.blackOverlay}>
                  TOTAL PENDIENTE
                </AppText>
              </View>
              <AppText variant="subtitle" style={styles.strong}>
                {formatMoney(totalPending)}
              </AppText>
            </View>
          ) : null}
          <Button
            title="Actualizar estados"
            variant="ghost"
            onPress={() => void reload()}
          />
          <View
            accessibilityLabel="Filtrar pagos"
            accessibilityRole="radiogroup"
            style={styles.filters}
          >
            {paymentFilters.map((option) => {
              const selected = filter === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setPage(1);
                    setFilter(option.value);
                  }}
                  style={({ pressed }) => [
                    styles.filter,
                    selected && styles.filterSelected,
                    pressed && styles.filterPressed,
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={selected ? colors.white : colors.primary}
                    style={styles.filterLabel}
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {isLoading ? (
            <DesksFeedbackCard
              icon="loader"
              title="Cargando pagos"
              description="Consultamos estados confirmados por Deskly."
            />
          ) : errorMessage ? (
            <DesksFeedbackCard
              icon="circleAlert"
              title="No pudimos cargar sus pagos"
              description={errorMessage}
            />
          ) : items.length === 0 ? (
            <DesksFeedbackCard
              icon="wallet"
              title={
                filter === "COMPLETED"
                  ? "No hay pagos completados"
                  : filter === "PENDING"
                    ? "No hay saldos pendientes"
                    : "No hay pagos registrados"
              }
              description={
                filter === "COMPLETED"
                  ? "Los pagos abonados en su totalidad aparecerán aquí."
                  : filter === "PENDING"
                    ? "Las reservas con una seña y saldo restante aparecerán aquí."
                    : "Sus pagos confirmados y saldos parciales aparecerán aquí."
              }
            />
          ) : (
            items.map((item) => (
              <PaymentCard
                key={item.reservationId}
                item={item}
                busy={busyReservation === item.reservationId}
                onQuote={() => void requestQuote(item.reservationId)}
              />
            ))
          )}
          {totalPages > 1 ? (
            <View style={styles.pagination}>
              <Button
                title="Anterior"
                variant="ghost"
                disabled={page === 1}
                onPress={() => setPage((value) => Math.max(1, value - 1))}
              />
              <AppText variant="caption">
                Pagina {page} de {totalPages}
              </AppText>
              <Button
                title="Siguiente"
                variant="ghost"
                disabled={page >= totalPages}
                onPress={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
              />
            </View>
          ) : null}
        </ScrollView>
        <BottomTabBar
          activeTab="payments"
          onPressDesks={props.onPressDesks}
          onPressReservations={props.onPressReservations}
          onPressSettings={props.onPressSettings}
          onPressProfile={props.onPressProfile}
          onPressLogout={props.onPressLogout}
          onPressSwitchAccount={props.onPressSwitchAccount}
          onPressUserManagement={props.onPressUserManagement}
          onPressChangePassword={props.onPressChangePassword}
        />
      </View>
      <PaymentQuoteModal
        quote={quote}
        busy={Boolean(quote && busyReservation === quote.reservationId)}
        formatMoney={formatMoney}
        onSelectOption={(option) => void startCheckout(option)}
        onClose={() => setQuote(null)}
      />
      {feedback ? (
        <StatusModal
          visible
          type={feedback.type}
          title={feedback.title}
          description={feedback.description}
          onClose={
            feedback.type === "loading" ? undefined : () => setFeedback(null)
          }
          actionLabel={
            feedback.canContinueInBackground ? "Dejar de esperar" : undefined
          }
          onAction={
            feedback.canContinueInBackground
              ? () => {
                  waitingInBackground.current = true;
                  setFeedback(null);
                }
              : undefined
          }
        />
      ) : null}
    </ScreenContainer>
  );
}

function PaymentCard({
  item,
  busy,
  onQuote,
}: {
  item: PaymentReservationItem;
  busy: boolean;
  onQuote: () => void;
}) {
  const latest = item.attempts[0];
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <AppText variant="body" style={styles.strong}>
            {item.deskName}
          </AppText>
          <AppText variant="caption" color={colors.primaryLight}>
            {item.dateLabel}
          </AppText>
        </View>
        <AppText
          variant="caption"
          color={
            item.pendingMinorUnits === 0
              ? statusColors.success
              : statusColors.warning
          }
          style={styles.strong}
        >
          {item.pendingMinorUnits === 0 ? "Pagado" : "Seña pagada"}
        </AppText>
      </View>
      <View style={styles.amountBlock}>
        <View style={styles.amountRow}>
          <AppText variant="caption" color={colors.blackOverlay}>
            Monto total
          </AppText>
          <AppText variant="caption" style={styles.strong}>
            {formatMoney(item.totalMinorUnits)}
          </AppText>
        </View>
        <View style={styles.amountRow}>
          <AppText variant="caption" color={colors.blackOverlay}>
            Abonado
          </AppText>
          <AppText variant="caption">
            {formatMoney(item.approvedMinorUnits)}
          </AppText>
        </View>
        <View style={[styles.amountRow, styles.amountRowBorder]}>
          <AppText variant="caption" color={colors.blackOverlay}>
            Saldo pendiente
          </AppText>
          <AppText
            variant="caption"
            color={
              item.pendingMinorUnits > 0
                ? statusColors.warning
                : statusColors.success
            }
            style={styles.strong}
          >
            {formatMoney(item.pendingMinorUnits)}
          </AppText>
        </View>
      </View>
      {item.pendingMinorUnits > 0 ? (
        <Button
          title={
            busy
              ? "Consultando..."
              : `Completar pago (${formatMoney(item.pendingMinorUnits)})`
          }
          disabled={busy}
          onPress={onQuote}
        />
      ) : latest ? (
        <AppText variant="caption" color={colors.primaryLight}>
          Último pago: {statusLabels[latest.status]}
        </AppText>
      ) : null}
    </View>
  );
}

async function pollPayment(
  accessToken: string,
  paymentId: string,
  expiresAt: string,
): Promise<PaymentStatus | null> {
  const providerDeadline = new Date(expiresAt).getTime();
  const deadline = Math.min(
    Number.isNaN(providerDeadline)
      ? Date.now() + 15 * 60_000
      : providerDeadline,
    Date.now() + 15 * 60_000,
  );
  while (true) {
    const payment = await getPaymentAttempt(accessToken, paymentId);
    if (TERMINAL_STATUSES.includes(payment.status)) return payment.status;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return null;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(3000, remaining)),
    );
  }
}

const styles = StyleSheet.create({
  layout: { flex: 1, gap: spacing.md },
  content: { gap: spacing.md, paddingBottom: spacing.lg },
  header: {
    gap: spacing.xs,
  },
  count: {
    fontWeight: "700",
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filter: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  filterSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPressed: { opacity: 0.8 },
  filterLabel: { fontWeight: "700" },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  statCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  statLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  amountBlock: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
  amountRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountRowBorder: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  pagination: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  strong: { fontWeight: "800" },
});
