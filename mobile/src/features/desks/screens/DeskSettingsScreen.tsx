import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { Input } from '../../../components/ui/Input';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { colors, statusColors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { useDeskSettings } from '../hooks/useDeskSettings';
import { Desk, DeskZone } from '../types/desk.types';
import { DeskPayload } from '../services/desks.service';

type DeskSettingsScreenProps = {
  onPressDesks?: () => void;
  onPressReservations?: () => void;
};

type DeskFormState = {
  code: string;
  name: string;
  descriptionId?: string;
  zone?: DeskZone;
  amenityIds: string[];
  enabled: boolean;
};

const emptyForm: DeskFormState = {
  code: '',
  name: '',
  amenityIds: [],
  enabled: true,
};

const zones: DeskZone[] = ['A', 'B', 'C'];

function getDeskName(desk: Desk) {
  return desk.name ?? `Escritorio ${desk.code}`;
}

function toFormState(desk: Desk): DeskFormState {
  return {
    code: desk.code,
    name: desk.name ?? '',
    descriptionId: desk.descriptionId,
    zone: desk.zone,
    amenityIds: desk.amenities.map((amenity) => amenity.id),
    enabled: desk.enabled,
  };
}

function buildPayload(form: DeskFormState): DeskPayload {
  return {
    code: form.code,
    name: form.name,
    descriptionId: form.descriptionId,
    zone: form.zone,
    amenityIds: form.amenityIds,
    enabled: form.enabled,
  };
}

function buildChangedPayload(form: DeskFormState, desk: Desk): DeskPayload {
  const original = toFormState(desk);
  const payload: DeskPayload = {};

  if (form.code !== original.code) {
    payload.code = form.code;
  }

  if (form.name !== original.name) {
    payload.name = form.name;
  }

  if (form.descriptionId !== original.descriptionId) {
    payload.descriptionId = form.descriptionId;
  }

  if (form.zone !== original.zone) {
    payload.zone = form.zone;
  }

  if (form.enabled !== original.enabled) {
    payload.enabled = form.enabled;
  }

  if (form.amenityIds.join('|') !== original.amenityIds.join('|')) {
    payload.amenityIds = form.amenityIds;
  }

  return payload;
}

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <AppText
        variant="caption"
        color={selected ? colors.white : colors.primary}
        style={styles.chipText}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function DeskSettingsScreen({
  onPressDesks,
  onPressReservations,
}: DeskSettingsScreenProps) {
  const {
    amenities,
    descriptions,
    desks,
    errorMessage,
    isLoading,
    isSaving,
    removeDesk,
    saveDesk,
    successMessage,
  } = useDeskSettings();
  const [editingDesk, setEditingDesk] = useState<Desk | null>(null);
  const [form, setForm] = useState<DeskFormState>(emptyForm);
  const formTitle = editingDesk ? 'Editar escritorio' : 'Nuevo escritorio';

  const canSubmit = useMemo(() => form.code.trim().length > 0, [form.code]);

  const handleEdit = (desk: Desk) => {
    setEditingDesk(desk);
    setForm(toFormState(desk));
  };

  const handleCancelEdit = () => {
    setEditingDesk(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const payload = editingDesk
      ? buildChangedPayload(form, editingDesk)
      : buildPayload(form);

    if (editingDesk && Object.keys(payload).length === 0) {
      handleCancelEdit();
      return;
    }

    await saveDesk(payload, editingDesk?.id);
    handleCancelEdit();
  };

  const toggleAmenity = (amenityId: string) => {
    setForm((current) => ({
      ...current,
      amenityIds: current.amenityIds.includes(amenityId)
        ? current.amenityIds.filter((id) => id !== amenityId)
        : [...current.amenityIds, amenityId],
    }));
  };

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <AppText variant="title">Configuración</AppText>
            <AppText variant="caption" color={colors.primaryLight} style={styles.count}>
              Gestión de escritorios
            </AppText>
          </View>

          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <AppText variant="subtitle" color={colors.primary} style={styles.cardTitle}>
                {formTitle}
              </AppText>
              {editingDesk ? (
                <Pressable accessibilityRole="button" onPress={handleCancelEdit}>
                  <AppText variant="caption" color={colors.primary} style={styles.linkText}>
                    Cancelar edición
                  </AppText>
                </Pressable>
              ) : null}
            </View>

            <Input
              label="Código"
              value={form.code}
              onChangeText={(code) => setForm((current) => ({ ...current, code }))}
              placeholder="A2"
            />

            <Input
              label="Nombre"
              value={form.name}
              onChangeText={(name) => setForm((current) => ({ ...current, name }))}
              placeholder="Escritorio A2"
            />

            <View style={styles.fieldGroup}>
              <AppText variant="caption" color={colors.blackOverlay} style={styles.label}>
                Zona
              </AppText>
              <View style={styles.chips}>
                {zones.map((zone) => (
                  <Chip
                    key={zone}
                    label={`Zona ${zone}`}
                    selected={form.zone === zone}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        zone: current.zone === zone ? undefined : zone,
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <AppText variant="caption" color={colors.blackOverlay} style={styles.label}>
                Tipo de escritorio
              </AppText>
              <View style={styles.chips}>
                {descriptions.map((description) => (
                  <Chip
                    key={description.id}
                    label={`${description.name} · ${description.peopleCapacity}`}
                    selected={form.descriptionId === description.id}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        descriptionId:
                          current.descriptionId === description.id
                            ? undefined
                            : description.id,
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <AppText variant="caption" color={colors.blackOverlay} style={styles.label}>
                Amenities
              </AppText>
              <View style={styles.chips}>
                {amenities.map((amenity) => (
                  <Chip
                    key={amenity.id}
                    label={amenity.name}
                    selected={form.amenityIds.includes(amenity.id)}
                    onPress={() => toggleAmenity(amenity.id)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.switchRow}>
              <View>
                <AppText variant="body" color={colors.primary} style={styles.switchTitle}>
                  Disponible para reservar
                </AppText>
                <AppText variant="caption" color={colors.primaryLight}>
                  La baja lógica se gestiona desde la lista.
                </AppText>
              </View>
              <Switch
                value={form.enabled}
                onValueChange={(enabled) =>
                  setForm((current) => ({ ...current, enabled }))
                }
                trackColor={{ false: colors.gray, true: colors.softMint }}
                thumbColor={form.enabled ? colors.primary : colors.primaryLight}
              />
            </View>

            <Button
              title={editingDesk ? 'Guardar cambios' : 'Crear escritorio'}
              disabled={!canSubmit || isSaving}
              onPress={handleSubmit}
            />
          </Card>

          {errorMessage ? (
            <Card style={styles.errorCard}>
              <AppText variant="body" color={statusColors.error} style={styles.feedbackText}>
                {errorMessage}
              </AppText>
            </Card>
          ) : null}

          {successMessage ? (
            <Card style={styles.successCard}>
              <AppText
                variant="body"
                color={statusColors.success}
                style={styles.feedbackText}
              >
                {successMessage}
              </AppText>
            </Card>
          ) : null}

          <View style={styles.section}>
            <AppText variant="caption" color={colors.primaryLight} style={styles.sectionTitle}>
              ESCRITORIOS
            </AppText>

            {isLoading ? (
              <Card style={styles.stateCard}>
                <Icon name="loader" size={24} color={colors.primary} />
                <AppText variant="body" color={colors.primaryLight}>
                  Cargando escritorios de la base de datos.
                </AppText>
              </Card>
            ) : desks.length > 0 ? (
              <View style={styles.list}>
                {desks.map((desk) => (
                  <Card key={desk.id} style={styles.deskCard}>
                    <View style={styles.deskHeader}>
                      <View style={styles.deskInfo}>
                        <AppText variant="subtitle" color={colors.primary} style={styles.cardTitle}>
                          {getDeskName(desk)}
                        </AppText>
                        <AppText variant="caption" color={colors.blackOverlay}>
                          Código {desk.code}
                          {desk.zone ? ` · Zona ${desk.zone}` : ''}
                        </AppText>
                      </View>
                      <View style={[styles.statusPill, !desk.enabled && styles.statusPillMuted]}>
                        <AppText
                          variant="caption"
                          color={desk.enabled ? statusColors.success : colors.primaryLight}
                          style={styles.statusText}
                        >
                          {desk.enabled ? 'Activo' : 'Inactivo'}
                        </AppText>
                      </View>
                    </View>

                    <AppText variant="caption" color={colors.primaryLight}>
                      {desk.description?.name ?? 'Sin tipo asignado'}
                    </AppText>

                    <View style={styles.actions}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleEdit(desk)}
                        style={({ pressed }) => [styles.ghostAction, pressed && styles.pressed]}
                      >
                        <AppText variant="caption" color={colors.primary} style={styles.linkText}>
                          Editar
                        </AppText>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        disabled={isSaving}
                        onPress={() => removeDesk(desk.id)}
                        style={({ pressed }) => [styles.dangerAction, pressed && styles.pressed]}
                      >
                        <AppText
                          variant="caption"
                          color={statusColors.error}
                          style={styles.linkText}
                        >
                          Dar de baja
                        </AppText>
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <Card style={styles.stateCard}>
                <Icon name="search" size={24} color={colors.primary} />
                <AppText variant="body" color={colors.primaryLight} style={styles.emptyText}>
                  No hay escritorios cargados. Creá el primero desde este formulario.
                </AppText>
              </Card>
            )}
          </View>
        </ScrollView>

        <BottomTabBar
          activeTab="settings"
          onPressDesks={onPressDesks}
          onPressReservations={onPressReservations}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    gap: spacing.md,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  count: {
    fontWeight: '700',
  },
  formCard: {
    gap: spacing.lg,
  },
  formHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontWeight: '800',
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontWeight: '800',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontWeight: '700',
  },
  errorCard: {
    backgroundColor: statusColors.errorSoft,
    borderColor: statusColors.error,
  },
  successCard: {
    backgroundColor: statusColors.successSoft,
    borderColor: statusColors.success,
  },
  feedbackText: {
    fontWeight: '700',
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontWeight: '900',
  },
  stateCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
  },
  deskCard: {
    gap: spacing.md,
  },
  deskHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  deskInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  statusPill: {
    backgroundColor: statusColors.successSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusPillMuted: {
    backgroundColor: colors.gray,
  },
  statusText: {
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  ghostAction: {
    borderRadius: radii.md,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  dangerAction: {
    borderColor: statusColors.error,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  linkText: {
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
