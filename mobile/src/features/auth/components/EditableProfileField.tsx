import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Icon } from '../../../components/ui/Icon';
import { colors, statusColors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

type EditableProfileFieldProps = {
  label: string;
  value: string | number;
  onSave: (newValue: string | number) => Promise<void>;
  onSuccess: () => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'number-pad';
  validate?: (value: string) => string | undefined;
  isLoading?: boolean;
};

export function EditableProfileField({
  label,
  value,
  onSave,
  onSuccess,
  keyboardType = 'default',
  validate,
  isLoading = false,
}: EditableProfileFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleEdit = () => {
    setEditValue(String(value));
    setValidationError(undefined);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(String(value));
    setValidationError(undefined);
    setSaveError(null);
  };

  const handleChangeText = (text: string) => {
    setEditValue(text);
    setSaveError(null);
    if (validate) {
      setValidationError(validate(text));
    }
  };

  const handleSave = async () => {
    if (validate) {
      const error = validate(editValue);
      if (error) {
        setValidationError(error);
        return;
      }
    }

    if (editValue.trim() === String(value).trim()) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(editValue);
      setIsEditing(false);
      onSuccess();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Error al guardar los cambios.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const hasError = Boolean(validationError || saveError);
  const canSave = !isSaving && !isLoading && !validationError;

  if (isEditing) {
    return (
      <View style={styles.editing}>
        <Input
          label={label}
          value={editValue}
          onChangeText={handleChangeText}
          keyboardType={keyboardType}
          editable={!isSaving && !isLoading}
          style={hasError ? styles.inputError : undefined}
        />
        {validationError ? (
          <AppText variant="caption" color={statusColors.error}>
            {validationError}
          </AppText>
        ) : null}
        {saveError ? (
          <AppText variant="caption" color={statusColors.error}>
            {saveError}
          </AppText>
        ) : null}
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button
              title="Cancelar"
              variant="ghost"
              disabled={isSaving || isLoading}
              onPress={handleCancel}
            />
          </View>
          <View style={styles.action}>
            <Button
              title={isSaving ? 'Guardando...' : 'Guardar'}
              disabled={!canSave}
              onPress={handleSave}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={styles.row}
      onPress={isLoading ? undefined : handleEdit}
      disabled={isLoading}
    >
      <View style={styles.content}>
        <AppText variant="caption" color={colors.primaryLight}>
          {label}
        </AppText>
        <AppText variant="body" color={colors.primary} style={styles.value}>
          {value}
        </AppText>
      </View>
      {!isLoading && (
        <Icon name="pencil" size={16} color={colors.primaryLight} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  editing: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  value: {
    fontWeight: '700',
  },
  inputError: {
    borderColor: statusColors.error,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
