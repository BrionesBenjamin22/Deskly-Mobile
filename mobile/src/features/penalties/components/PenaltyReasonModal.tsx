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

            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <AppText variant="caption" color={colors.blackOverlay} style={styles.inputLabel}>
                  Motivo de la cancelacion
                </AppText>
                <AppText variant="caption" color={colors.primaryLight} style={styles.counter}>
                  {reason.length}/500
                </AppText>
              </View>
              <Input
                placeholder="Ej.: El miembro no se presento luego del periodo de tolerancia"
                value={reason}
                onChangeText={onChangeReason}
                multiline
                numberOfLines={4}
                maxLength={500}
                autoComplete="off"
                autoCorrect={false}
                label=""
                containerStyle={styles.inputContainer}
                style={styles.input}
              />
            </View>

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
    gap: spacing.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 520,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  heading: { gap: spacing.sm },
  title: { fontWeight: '800', textAlign: 'center', marginBottom: spacing.xs },
  description: { textAlign: 'center' },
  inputWrapper: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontWeight: '700',
    color: colors.blackOverlay,
  },
  inputContainer: {
    flex: 0,
  },
  input: {
    minHeight: 120,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
  },
  counter: {
    textAlign: 'right',
    color: colors.primaryLight,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    width: '100%',
  },
  action: {
    flex: 1,
    minWidth: 0,
  },
  keyboardArea: { flex: 1 },
});
