import { Modal, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "../../../components/ui/AppText";
import { Button } from "../../../components/ui/Button";
import { colors } from "../../../theme/colors";
import { radii, spacing } from "../../../theme/spacing";
import type { PaymentOption, PaymentQuote } from "../types/payment.types";

type PaymentQuoteModalProps = {
  quote: PaymentQuote | null;
  busy: boolean;
  formatMoney: (minorUnits: number) => string;
  onSelectOption: (option: PaymentOption) => void;
  onClose: () => void;
};

export function PaymentQuoteModal({
  quote,
  busy,
  formatMoney,
  onSelectOption,
  onClose,
}: PaymentQuoteModalProps) {
  if (!quote) return null;

  return (
    <Modal
      animationType="fade"
      transparent
      visible
      onRequestClose={busy ? undefined : onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar opciones de pago"
        style={styles.overlay}
        onPress={busy ? undefined : onClose}
      >
        <Pressable
          accessibilityRole="none"
          accessibilityViewIsModal
          style={styles.dialog}
          onPress={() => {}}
        >
          <View style={styles.heading}>
            <AppText variant="subtitle" style={styles.title}>
              Completar pago
            </AppText>
            <AppText
              variant="body"
              color={colors.primaryLight}
              style={styles.description}
            >
              Elija una opción para abonar el saldo pendiente.
            </AppText>
          </View>

          <View style={styles.actions} accessibilityLabel="Cotización de pago">
            {quote.options.map((option) => (
              <Button
                key={option.option}
                title={`${option.option === "DEPOSIT" ? "Pagar seña" : "Pagar total"}: ${formatMoney(option.amountMinorUnits)}`}
                disabled={busy}
                onPress={() => onSelectOption(option.option)}
              />
            ))}
            <Button
              title="Cancelar"
              variant="ghost"
              disabled={busy}
              onPress={onClose}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.screenX,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    elevation: 5,
    gap: spacing.lg,
    maxWidth: 520,
    padding: spacing.xl,
    shadowColor: colors.blackOverlay,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: "100%",
  },
  heading: { gap: spacing.sm },
  title: { fontWeight: "800", textAlign: "center" },
  description: { textAlign: "center" },
  actions: { gap: spacing.md },
});
