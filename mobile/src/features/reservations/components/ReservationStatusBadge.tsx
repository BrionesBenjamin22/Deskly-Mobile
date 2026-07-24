import { StyleSheet, View } from "react-native";

import { AppText } from "../../../components/ui/AppText";
import { Icon, IconName } from "../../../components/ui/Icon";
import { colors, statusColors } from "../../../theme/colors";
import { radii, spacing } from "../../../theme/spacing";
import { ReservationStatus } from "../types/reservation.types";

type ReservationStatusBadgeProps = {
  status: ReservationStatus;
};

const statusMap: Record<
  ReservationStatus,
  { label: string; backgroundColor: string; color: string; icon: IconName }
> = {
  pending_payment: {
    label: "Pendiente de pago",
    backgroundColor: colors.background,
    color: statusColors.warning,
    icon: "wallet",
  },
  reserved: {
    label: "Reservada",
    backgroundColor: colors.softMint,
    color: colors.accent,
    icon: "calendar",
  },
  active: {
    label: "Activa",
    backgroundColor: statusColors.successSoft,
    color: statusColors.success,
    icon: "circleCheck",
  },
  completed: {
    label: "Finalizada",
    backgroundColor: colors.gray,
    color: colors.primaryLight,
    icon: "circleCheck",
  },
  cancelled: {
    label: "Cancelada",
    backgroundColor: statusColors.errorSoft,
    color: statusColors.error,
    icon: "circleAlert",
  },
};

export function ReservationStatusBadge({
  status,
}: ReservationStatusBadgeProps) {
  const config = statusMap[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Icon name={config.icon} size={13} color={config.color} />
      <AppText variant="caption" color={config.color} style={styles.text}>
        {config.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontWeight: "800",
  },
});
