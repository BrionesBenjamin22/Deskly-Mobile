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
import { Desk, DeskAmenity, DeskZone } from '../types/desk.types';
import { DeskPayload } from '../services/desks.service';
import { UserRole } from '../../auth/types/auth.types';

type DeskSettingsScreenProps = {
  onPressDesks?: () => void;
  onPressReservations?: () => void;
  onPressProfile?: () => void;
  onPressPayments?: () => void;
  onPressLogout?: () => void;
  onDeskCreated?: () => void;
  onPressSwitchAccount?: () => void;
  onPressUserManagement?: () => void;
  onPressChangePassword?: () => void;
  userRole?: UserRole;
};

type DeskFormState = {
  name: string;
  peopleCapacity: string;
  descriptionId?: string;
  zone?: DeskZone;
  amenityIds: string[];
  enabled: boolean;
};

type DeskFormErrors = {
  name?: string;
  peopleCapacity?: string;
};

type DeskFormTouched = Record<keyof DeskFormErrors, boolean>;

type AmenityFormErrors = {
  name?: string;
};

const emptyForm: DeskFormState = {
  name: '',
  peopleCapacity: '1',
  amenityIds: [],
  enabled: true,
};

const emptyDeskTouched: DeskFormTouched = {
  name: false,
  peopleCapacity: false,
};

const zones: DeskZone[] = ['A', 'B', 'C'];
const MAX_NAME_LENGTH = 120;
const AMENITY_NAME_PATTERN = /^(?=.*[A-Za-z])[A-Za-z0-9 ']+$/;

function getDeskName(desk: Desk) {
  return desk.name ?? `Escritorio ${desk.code}`;
}

function toFormState(desk: Desk): DeskFormState {
  return {
    name: desk.name ?? '',
    peopleCapacity: String(desk.peopleCapacity),
    descriptionId: desk.descriptionId,
    zone: desk.zone,
    amenityIds: desk.amenities.map((amenity) => amenity.id),
    enabled: desk.enabled,
  };
}

function buildPayload(form: DeskFormState): DeskPayload {
  return {
    name: form.name,
    peopleCapacity: Number(form.peopleCapacity),
    descriptionId: form.descriptionId,
    zone: form.zone,
    amenityIds: form.amenityIds,
    enabled: form.enabled,
  };
}

function buildChangedPayload(form: DeskFormState, desk: Desk): DeskPayload {
  const original = toFormState(desk);
  const payload: DeskPayload = {};

  if (form.name !== original.name) {
    payload.name = form.name;
  }

  if (form.peopleCapacity !== original.peopleCapacity) {
    payload.peopleCapacity = Number(form.peopleCapacity);
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

function validateDeskForm(form: DeskFormState): DeskFormErrors {
  const errors: DeskFormErrors = {};
  const peopleCapacity = Number(form.peopleCapacity);

  if (!form.name.trim()) {
    errors.name = 'Ingrese el nombre del escritorio.';
  } else if (form.name.trim().length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`;
  }

  if (!form.peopleCapacity.trim()) {
    errors.peopleCapacity = 'Ingrese la cantidad de personas.';
  } else if (!Number.isInteger(peopleCapacity)) {
    errors.peopleCapacity = 'La cantidad de personas debe ser un numero entero.';
  } else if (peopleCapacity < 1) {
    errors.peopleCapacity = 'La cantidad de personas debe ser mayor o igual a 1.';
  }

  return errors;
}

function validateAmenityForm(name: string): AmenityFormErrors {
  const errors: AmenityFormErrors = {};
  const normalizedName = name.trim();

  if (!normalizedName) {
    errors.name = 'Ingrese el nombre del amenity.';
  } else if (!AMENITY_NAME_PATTERN.test(normalizedName)) {
    errors.name = 'Ingrese un nombre valido para el amenity.';
  } else if (normalizedName.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`;
  }

  return errors;
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
  onPressProfile,
  onPressPayments,
  onPressLogout,
  onPressSwitchAccount,
  onPressUserManagement,
  onPressChangePassword,
  userRole,
  onDeskCreated,
}: DeskSettingsScreenProps) {
  const {
    amenities,
    clearFeedback,
    descriptions,
    desks,
    errorMessage,
    isLoading,
    isSaving,
    removeAmenity,
    removeDesk,
    saveAmenity,
    saveDesk,
    successMessage,
  } = useDeskSettings();
  const [editingDesk, setEditingDesk] = useState<Desk | null>(null);
  const [editingAmenity, setEditingAmenity] = useState<DeskAmenity | null>(
    null,
  );
  const [form, setForm] = useState<DeskFormState>(emptyForm);
  const [deskTouched, setDeskTouched] =
    useState<DeskFormTouched>(emptyDeskTouched);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [amenityName, setAmenityName] = useState('');
  const [amenityTouched, setAmenityTouched] = useState(false);
  const [amenitySubmitAttempted, setAmenitySubmitAttempted] = useState(false);
  const formTitle = editingDesk ? 'Editar escritorio' : 'Nuevo escritorio';
  const amenityFormTitle = editingAmenity
    ? 'Editar amenities'
    : 'Nuevo amenities';
  const deskFormErrors = useMemo(() => validateDeskForm(form), [form]);
  const amenityFormErrors = useMemo(
    () => validateAmenityForm(amenityName),
    [amenityName],
  );

  const canSubmit = useMemo(
    () => Object.keys(deskFormErrors).length === 0,
    [deskFormErrors],
  );
  const canSubmitAmenity = useMemo(
    () => Object.keys(amenityFormErrors).length === 0,
    [amenityFormErrors],
  );

  const handleEdit = (desk: Desk) => {
    setEditingDesk(desk);
    setForm(toFormState(desk));
    setDeskTouched(emptyDeskTouched);
    setSubmitAttempted(false);
  };

  const handleCancelEdit = () => {
    setEditingDesk(null);
    setForm(emptyForm);
    setDeskTouched(emptyDeskTouched);
    setSubmitAttempted(false);
  };

  const handleEditAmenity = (amenity: DeskAmenity) => {
    setEditingAmenity(amenity);
    setAmenityName(amenity.name);
    setAmenityTouched(false);
    setAmenitySubmitAttempted(false);
  };

  const handleCancelAmenityEdit = () => {
    setEditingAmenity(null);
    setAmenityName('');
    setAmenityTouched(false);
    setAmenitySubmitAttempted(false);
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setDeskTouched({ name: true, peopleCapacity: true });

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

    const saved = await saveDesk(payload, editingDesk?.id);

    if (saved) {
      if (!editingDesk) {
        onDeskCreated?.();
      }
      handleCancelEdit();
    }
  };

  const handleSubmitAmenity = async () => {
    setAmenitySubmitAttempted(true);
    setAmenityTouched(true);

    if (!canSubmitAmenity) {
      return;
    }

    if (editingAmenity && amenityName.trim() === editingAmenity.name) {
      handleCancelAmenityEdit();
      return;
    }

    const saved = await saveAmenity({ name: amenityName }, editingAmenity?.id);

    if (saved) {
      handleCancelAmenityEdit();
    }
  };

  const toggleAmenity = (amenityId: string) => {
    setForm((current) => ({
      ...current,
      amenityIds: current.amenityIds.includes(amenityId)
        ? current.amenityIds.filter((id) => id !== amenityId)
        : [...current.amenityIds, amenityId],
    }));
  };
  const shouldShowNameError =
    Boolean(deskFormErrors.name) && (deskTouched.name || submitAttempted);
  const shouldShowPeopleCapacityError =
    Boolean(deskFormErrors.peopleCapacity) &&
    (deskTouched.peopleCapacity || submitAttempted);
  const shouldShowAmenityError =
    Boolean(amenityFormErrors.name) &&
    (amenityTouched || amenitySubmitAttempted);

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
              label="Nombre"
              value={form.name}
              onChangeText={(name) => {
                setDeskTouched((current) => ({ ...current, name: true }));
                setForm((current) => ({ ...current, name }));
              }}
              placeholder="Escritorio A2"
              maxLength={MAX_NAME_LENGTH + 1}
              style={shouldShowNameError ? styles.inputError : undefined}
            />
            {shouldShowNameError ? (
              <AppText variant="caption" color={statusColors.error} style={styles.fieldErrorText}>
                {deskFormErrors.name}
              </AppText>
            ) : null}

            <Input
              label="Cantidad de personas"
              value={form.peopleCapacity}
              onChangeText={(peopleCapacity) => {
                setDeskTouched((current) => ({
                  ...current,
                  peopleCapacity: true,
                }));
                setForm((current) => ({
                  ...current,
                  peopleCapacity: peopleCapacity.replace(/\D/g, ''),
                }));
              }}
              keyboardType="number-pad"
              placeholder="2"
              style={
                shouldShowPeopleCapacityError ? styles.inputError : undefined
              }
            />
            {shouldShowPeopleCapacityError ? (
              <AppText variant="caption" color={statusColors.error} style={styles.fieldErrorText}>
                {deskFormErrors.peopleCapacity}
              </AppText>
            ) : null}

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
                    label={description.name}
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
            <Pressable accessibilityRole="button" onPress={clearFeedback}>
              <Card style={styles.errorCard}>
                <AppText variant="body" color={statusColors.error} style={styles.feedbackText}>
                  {errorMessage}
                </AppText>
              </Card>
            </Pressable>
          ) : null}

          {successMessage ? (
            <Pressable accessibilityRole="button" onPress={clearFeedback}>
              <Card style={styles.successCard}>
                <AppText
                  variant="body"
                  color={statusColors.success}
                  style={styles.feedbackText}
                >
                  {successMessage}
                </AppText>
              </Card>
            </Pressable>
          ) : null}

          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <AppText variant="subtitle" color={colors.primary} style={styles.cardTitle}>
                {amenityFormTitle}
              </AppText>
              {editingAmenity ? (
                <Pressable accessibilityRole="button" onPress={handleCancelAmenityEdit}>
                  <AppText variant="caption" color={colors.primary} style={styles.linkText}>
                    Cancelar edición
                  </AppText>
                </Pressable>
              ) : null}
            </View>

            <Input
              label="Nombre"
              value={amenityName}
              onChangeText={(value) => {
                setAmenityTouched(true);
                setAmenityName(value);
              }}
              placeholder="Monitor"
              maxLength={MAX_NAME_LENGTH + 1}
              style={shouldShowAmenityError ? styles.inputError : undefined}
            />
            {shouldShowAmenityError ? (
              <AppText variant="caption" color={statusColors.error} style={styles.fieldErrorText}>
                {amenityFormErrors.name}
              </AppText>
            ) : null}

            <Button
              title={editingAmenity ? 'Guardar amenities' : 'Crear amenities'}
              disabled={!canSubmitAmenity || isSaving}
              onPress={handleSubmitAmenity}
            />
          </Card>

          <View style={styles.section}>
            <AppText variant="caption" color={colors.primaryLight} style={styles.sectionTitle}>
              AMENITIES
            </AppText>

            {isLoading ? (
              <Card style={styles.stateCard}>
                <Icon name="loader" size={24} color={colors.primary} />
                <AppText variant="body" color={colors.primaryLight}>
                  Cargando amenities de la base de datos.
                </AppText>
              </Card>
            ) : amenities.length > 0 ? (
              <View style={styles.list}>
                {amenities.map((amenity) => (
                  <Card key={amenity.id} style={styles.amenityCard}>
                    <View style={styles.deskHeader}>
                      <View style={styles.deskInfo}>
                        <AppText variant="subtitle" color={colors.primary} style={styles.cardTitle}>
                          {amenity.name}
                        </AppText>
                      </View>
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleEditAmenity(amenity)}
                        style={({ pressed }) => [styles.ghostAction, pressed && styles.pressed]}
                      >
                        <AppText variant="caption" color={colors.primary} style={styles.linkText}>
                          Editar
                        </AppText>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        disabled={isSaving}
                        onPress={() => removeAmenity(amenity.id)}
                        style={({ pressed }) => [styles.dangerAction, pressed && styles.pressed]}
                      >
                        <AppText
                          variant="caption"
                          color={statusColors.error}
                          style={styles.linkText}
                        >
                          Eliminar
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
                  No hay amenities cargados. Cree el primero desde este formulario.
                </AppText>
              </Card>
            )}
          </View>

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
                      {desk.description?.name ?? 'Sin tipo asignado'} · {desk.peopleCapacity}{' '}
                      {desk.peopleCapacity === 1 ? 'persona' : 'personas'}
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
          onPressProfile={onPressProfile}
          onPressPayments={onPressPayments}
          onPressLogout={onPressLogout}
          onPressSwitchAccount={onPressSwitchAccount}
          onPressUserManagement={onPressUserManagement}
          onPressChangePassword={onPressChangePassword}
          userRole={userRole}
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
  inputError: {
    borderColor: statusColors.error,
  },
  fieldErrorText: {
    fontWeight: '700',
    marginTop: -spacing.sm,
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
  amenityCard: {
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
