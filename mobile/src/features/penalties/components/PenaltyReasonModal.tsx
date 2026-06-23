import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';

type PenaltyReasonModalProps = {
  visible: boolean;
  reason: string;
  onChangeReason: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PenaltyReasonModal({
  visible,
  reason,
  onChangeReason,
  onConfirm,
  onCancel,
}: PenaltyReasonModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <AppText variant="subtitle" style={styles.title}>Cancelar reserva por ausencia</AppText>
          <AppText variant="body" color={colors.primaryLight}>
            Indique el motivo. La cancelacion registrara una advertencia o penalizacion para el miembro.
          </AppText>
          <Input
            label="Motivo de la cancelacion"
            placeholder="Ej.: El miembro no se presento luego del periodo de tolerancia"
            value={reason}
            onChangeText={onChangeReason}
            multiline
            maxLength={500}
            style={styles.input}
          />
          <View style={styles.actions}>
            <Button title="Volver" variant="ghost" onPress={onCancel} />
            <Button title="Confirmar cancelacion" onPress={onConfirm} disabled={reason.trim().length < 3} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.screenX,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    gap: spacing.md,
    padding: spacing.xl,
    width: '100%',
  },
  title: { fontWeight: '800' },
  input: { minHeight: 110, paddingVertical: spacing.md, textAlignVertical: 'top' },
  actions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end' },
});
