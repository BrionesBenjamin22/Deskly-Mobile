import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, statusColors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: IconName;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  icon = 'circleAlert',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable accessibilityRole="button" style={styles.overlay} onPress={onCancel}>
        <View style={styles.backdrop} />
        <Pressable accessibilityRole="none" style={styles.dialog} onPress={() => {}}>
          <View style={[styles.iconCircle, destructive ? styles.iconCircleDestructive : styles.iconCircleNeutral]}>
            <Icon
              name={icon}
              size={32}
              color={destructive ? statusColors.error : colors.primaryLight}
            />
          </View>

          <AppText variant="subtitle" style={styles.title}>
            {title}
          </AppText>

          {description ? (
            <AppText variant="body" color={colors.primaryLight} style={styles.description}>
              {description}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.pressed]}
            >
              <AppText variant="caption" color={colors.primary} style={styles.btnText}>
                {cancelLabel}
              </AppText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                destructive ? styles.btnDestructive : styles.btnConfirm,
                pressed && styles.pressed,
              ]}
            >
              <AppText variant="caption" color={colors.white} style={styles.btnText}>
                {confirmLabel}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenX,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    width: '100%',
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 999,
    height: 68,
    justifyContent: 'center',
    width: 68,
    marginBottom: spacing.xs,
  },
  iconCircleDestructive: {
    backgroundColor: statusColors.errorSoft,
  },
  iconCircleNeutral: {
    backgroundColor: colors.background,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    width: '100%',
  },
  btn: {
    flex: 1,
    minHeight: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  btnConfirm: {
    backgroundColor: colors.primary,
  },
  btnDestructive: {
    backgroundColor: statusColors.error,
  },
  btnText: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
