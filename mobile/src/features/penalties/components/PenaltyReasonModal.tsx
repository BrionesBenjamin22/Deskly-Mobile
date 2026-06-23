import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Icon } from '../../../components/ui/Icon';
import { colors, statusColors } from '../../../theme/colors';
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}
      >
        <Pressable style={styles.overlay} onPress={onCancel}>
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.iconCircle}>
              <Icon name="circleAlert" size={30} color={statusColors.error} />
            </View>

            <View style={styles.heading}>
              <AppText variant="subtitle" style={styles.title}>
                Cancelar reserva por ausencia
              </AppText>
              <AppText variant="body" color={colors.primaryLight} style={styles.description}>
                Explique por que se cancela la reserva. El antecedente quedara asociado al miembro y a esta reserva.
              </AppText>
            </View>

            <Input
              label="Motivo de la cancelacion"
              placeholder="Ej.: El miembro no se presento luego del periodo de tolerancia"
              value={reason}
              onChangeText={onChangeReason}
              multiline
              maxLength={500}
              containerStyle={styles.inputContainer}
              style={styles.input}
            />
            <AppText variant="caption" color={colors.primaryLight} style={styles.counter}>
              {reason.length}/500
            </AppText>

            <View style={styles.actions}>
              <View style={styles.action}>
                <Button title="Volver" variant="ghost" onPress={onCancel} />
              </View>
              <View style={styles.action}>
                <Button
                  title="Confirmar cancelacion"
                  onPress={onConfirm}
                  disabled={reason.trim().length < 3}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
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
    maxWidth: 520,
  },
  iconCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: statusColors.errorSoft,
    borderRadius: radii.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  heading: { gap: spacing.xs },
  title: { fontWeight: '800', textAlign: 'center' },
  description: { textAlign: 'center' },
  inputContainer: { flex: 0 },
  input: {
    minHeight: 112,
    paddingTop: spacing.md,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
  },
  counter: { marginTop: -spacing.sm, textAlign: 'right' },
  actions: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  action: { flex: 1 },
  keyboardArea: { flex: 1 },
});
