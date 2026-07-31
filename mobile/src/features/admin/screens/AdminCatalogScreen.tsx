import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { Input } from '../../../components/ui/Input';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { StatusModal } from '../../../components/ui/StatusModal';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import {
  Desk,
  DeskAmenity,
  DeskZone,
  Locality,
  WorkArea,
} from '../../desks/types/desk.types';
import { useAdminCatalog } from '../hooks/useAdminCatalog';
import { useAuth } from '../../auth/context/AuthContext';

type Category = 'desks' | 'amenities' | 'localities' | 'workAreas';
type CatalogItem = Desk | DeskAmenity | Locality | WorkArea;

type Props = {
  onPressAdminCatalog: () => void;
  onPressUserManagement: () => void;
  onPressProfile: () => void;
  onPressLogout: () => void;
  onPressSwitchAccount: () => void;
  onPressChangePassword?: () => void;
};

const categories: {
  key: Category;
  title: string;
  description: string;
}[] = [
  {
    key: 'desks',
    title: 'Escritorios',
    description: 'Administre los puestos disponibles en el sistema.',
  },
  {
    key: 'amenities',
    title: 'Amenities',
    description: 'Administre los servicios asociados a los escritorios.',
  },
  {
    key: 'localities',
    title: 'Localidades',
    description: 'Administre las ciudades donde opera Deskly.',
  },
  {
    key: 'workAreas',
    title: 'Áreas de trabajo',
    description: 'Administre sedes, direcciones y ubicaciones.',
  },
];

function itemName(item: CatalogItem) {
  if ('code' in item) {
    return item.name || `Escritorio ${item.code}`;
  }
  return item.name;
}

export function AdminCatalogScreen(props: Props) {
  const { accessToken } = useAuth();
  const catalog = useAdminCatalog(accessToken);
  const [category, setCategory] = useState<Category | null>(null);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [deleting, setDeleting] = useState<CatalogItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [amenityIds, setAmenityIds] = useState<string[]>([]);
  const [localityId, setLocalityId] = useState('');
  const [deskLocalityId, setDeskLocalityId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [zone, setZone] = useState<DeskZone | ''>('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [page, setPage] = useState(1);

  const items = useMemo(() => {
    if (category === 'desks') return catalog.desks;
    if (category === 'amenities') return catalog.amenities;
    if (category === 'localities') return catalog.localities;
    if (category === 'workAreas') return catalog.workAreas;
    return [];
  }, [
    catalog.amenities,
    catalog.desks,
    catalog.localities,
    catalog.workAreas,
    category,
  ]);

  const selectedCategory = categories.find((item) => item.key === category);
  const totalPages = Math.max(1, Math.ceil(items.length / 9));
  const visibleItems = items.slice((page - 1) * 9, page * 9);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setCapacity('1');
    setAmenityIds([]);
    setLocalityId('');
    setDeskLocalityId('');
    setAreaId('');
    setZone('');
    setAddress('');
    setLatitude('');
    setLongitude('');
  };

  const startCreate = () => resetForm();

  const startEdit = (item: CatalogItem) => {
    setEditing(item);
    setName(itemName(item));
    setDescription('localityId' in item ? item.description ?? '' : '');
    setCapacity(
      'peopleCapacity' in item ? String(item.peopleCapacity) : '1',
    );
    setAmenityIds('code' in item ? item.amenities.map(({ id }) => id) : []);
    if ('code' in item) {
      // editing a Desk
      const desk = item as Desk;
      setDeskLocalityId(desk.area?.localityId ?? '');
      setAreaId(desk.areaId ?? desk.area?.id ?? '');
      setZone(desk.zone ?? '');
    }
    if ('localityId' in item) {
      setDescription(item.description ?? '');
      setLocalityId(item.localityId);
      setAddress(item.address ?? '');
      setLatitude(item.latitude == null ? '' : String(item.latitude));
      setLongitude(item.longitude == null ? '' : String(item.longitude));
    } else {
      setLocalityId('');
      setAddress('');
      setLatitude('');
      setLongitude('');
    }
  };

  const handleSave = async () => {
    const normalizedName = name.trim();
    if (!category || !normalizedName) return;

    let saved = false;
    if (category === 'amenities') {
      const unchanged = editing && itemName(editing) === normalizedName;
      if (unchanged) {
        resetForm();
        return;
      }
      saved = await catalog.saveAmenity(
        { name: normalizedName },
        editing?.id,
      );
    } else if (category === 'localities') {
      const current = editing as Locality | null;
      const payload = current
        ? current.name !== normalizedName
          ? { name: normalizedName }
          : {}
        : { name: normalizedName };
      if (current && Object.keys(payload).length === 0) {
        resetForm();
        return;
      }
      saved = await catalog.saveLocality(payload, editing?.id);
    } else if (category === 'workAreas') {
      if (!localityId) return;
      const current = editing as WorkArea | null;
      const normalizedAddress = address.trim();
      const normalizedDescription = description.trim();
      const parsedLatitude = latitude ? Number(latitude) : undefined;
      const parsedLongitude = longitude ? Number(longitude) : undefined;
      const payload = current
        ? {
            ...(current.name !== normalizedName
              ? { name: normalizedName }
              : {}),
            ...(current.localityId !== localityId ? { localityId } : {}),
            ...((current.description ?? '') !== normalizedDescription
              ? { description: normalizedDescription }
              : {}),
            ...((current.address ?? '') !== normalizedAddress
              ? { address: normalizedAddress }
              : {}),
            ...((current.latitude ?? undefined) !== parsedLatitude
              ? { latitude: parsedLatitude }
              : {}),
            ...((current.longitude ?? undefined) !== parsedLongitude
              ? { longitude: parsedLongitude }
              : {}),
          }
        : {
            name: normalizedName,
            localityId,
            description: normalizedDescription,
            address: normalizedAddress,
            ...(parsedLatitude !== undefined ? { latitude: parsedLatitude } : {}),
            ...(parsedLongitude !== undefined
              ? { longitude: parsedLongitude }
              : {}),
          };
      if (current && Object.keys(payload).length === 0) {
        resetForm();
        return;
      }
      saved = await catalog.saveWorkArea(payload, editing?.id);
    } else {
      const peopleCapacity = Number(capacity);
      if (!Number.isInteger(peopleCapacity) || peopleCapacity < 1) return;
      const current = editing as Desk | null;
      const normalizedZone = zone || undefined;
      const payload = current
        ? {
            ...(itemName(current) !== normalizedName
              ? { name: normalizedName }
              : {}),
            ...(current.peopleCapacity !== peopleCapacity
              ? { peopleCapacity }
              : {}),
            ...(current.amenities.map(({ id }) => id).join('|') !==
            amenityIds.join('|')
              ? { amenityIds }
              : {}),
            ...(current.areaId !== areaId ? { areaId } : {}),
            ...(current.zone !== normalizedZone ? { zone: normalizedZone } : {}),
          }
        : {
            name: normalizedName,
            peopleCapacity,
            amenityIds,
            areaId,
            zone: normalizedZone,
          };
      if (current && Object.keys(payload).length === 0) {
        resetForm();
        return;
      }
      saved = await catalog.saveDesk(payload, editing?.id);
    }

    if (saved) resetForm();
  };

  const handleDelete = async () => {
    if (!category || !deleting) return;
    const id = deleting.id;
    setDeleting(null);
    if (category === 'desks') await catalog.removeDesk(id);
    if (category === 'amenities') await catalog.removeAmenity(id);
    if (category === 'localities') await catalog.removeLocality(id);
    if (category === 'workAreas') await catalog.removeWorkArea(id);
  };

  const deleteTitle =
    category === 'desks'
      ? 'Eliminar escritorio'
      : category === 'amenities'
          ? 'Eliminar amenity'
          : category === 'localities'
            ? 'Eliminar localidad'
            : 'Eliminar área de trabajo';

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heading}>
            <AppText variant="title">Panel de administración</AppText>
            <AppText variant="body" color={colors.primaryLight}>
              Seleccione una categoría para administrar sus elementos.
            </AppText>
          </View>

          {!category ? (
            <View style={styles.grid}>
              {categories.map((item) => (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  onPress={() => {
                    resetForm();
                    setPage(1);
                    setCategory(item.key);
                  }}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Card style={styles.categoryCard}>
                    <AppText variant="subtitle" color={colors.primary}>
                      {item.title}
                    </AppText>
                    <AppText variant="body" color={colors.primaryLight}>
                      {item.description}
                    </AppText>
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.heading}>
                  <AppText variant="subtitle" color={colors.primary}>
                    {selectedCategory?.title}
                  </AppText>
                  <AppText variant="caption" color={colors.primaryLight}>
                    {items.length} elementos registrados
                  </AppText>
                </View>
                <Button
                  title="Volver al panel"
                  variant="ghost"
                  onPress={() => {
                    resetForm();
                    setPage(1);
                    setCategory(null);
                  }}
                />
              </View>

              <Card style={styles.formCard}>
                <AppText variant="subtitle" color={colors.primary}>
                  {editing ? 'Editar elemento' : 'Nuevo elemento'}
                </AppText>
                <Input
                  label="Nombre"
                  value={name}
                  onChangeText={setName}
                  placeholder="Ingrese un nombre"
                  maxLength={120}
                />
                {category === 'workAreas' ? (
                  <Input
                    label="Descripción"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Descripción opcional"
                    maxLength={255}
                  />
                ) : null}
                {category === 'desks' ? (
                  <Input
                    label="Capacidad"
                    value={capacity}
                    onChangeText={(value) =>
                      setCapacity(value.replace(/\D/g, ''))
                    }
                    keyboardType="number-pad"
                    placeholder="1"
                  />
                ) : null}
                {category === 'desks' ? (
                  <>
                    <View style={styles.fieldGroup}>
                      <AppText variant="caption" color={colors.blackOverlay} style={styles.label}>
                        Zona
                      </AppText>
                      <View style={styles.chips}>
                        {(['A','B','C'] as DeskZone[]).map((z) => (
                          <Pressable
                            key={z}
                            accessibilityRole="button"
                            onPress={() => setZone(zone === z ? '' : z)}
                            style={({ pressed }) => [
                              styles.chip,
                              zone === z && styles.chipSelected,
                              pressed && styles.pressed,
                            ]}
                          >
                            <AppText variant="caption" color={zone === z ? colors.white : colors.primary}>
                              Zona {z}
                            </AppText>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <AppText variant="caption" color={colors.blackOverlay} style={styles.label}>
                        Localidad
                      </AppText>
                      <View style={styles.amenityOptions}>
                        {catalog.localities.map((locality) => (
                          <Pressable
                            key={locality.id}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: deskLocalityId === locality.id }}
                            onPress={() => {
                              setDeskLocalityId(deskLocalityId === locality.id ? '' : locality.id);
                              if (deskLocalityId === locality.id) setAreaId('');
                            }}
                            style={({ pressed }) => [
                              styles.amenityOption,
                              deskLocalityId === locality.id && styles.amenityOptionSelected,
                              pressed && styles.pressed,
                            ]}
                          >
                            <AppText variant="caption" color={deskLocalityId === locality.id ? colors.white : colors.primary}>
                              {locality.name}
                            </AppText>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <AppText variant="caption" color={colors.blackOverlay} style={styles.label}>
                        Área de trabajo
                      </AppText>
                      <View style={styles.amenityOptions}>
                        {catalog.workAreas
                          .filter((area) => (deskLocalityId ? area.localityId === deskLocalityId : true))
                          .map((area) => (
                          <Pressable
                            key={area.id}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: areaId === area.id }}
                            onPress={() => setAreaId(areaId === area.id ? '' : area.id)}
                            style={({ pressed }) => [
                              styles.amenityOption,
                              areaId === area.id && styles.amenityOptionSelected,
                              pressed && styles.pressed,
                            ]}
                          >
                            <AppText variant="caption" color={areaId === area.id ? colors.white : colors.primary}>
                              {area.name}{area.locality ? ` - ${area.locality.name}` : ''}
                            </AppText>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </>
                ) : null}
                {category === 'workAreas' ? (
                  <>
                    <View style={styles.amenityField}>
                      <AppText variant="caption" color={colors.primaryLight}>
                        Localidad
                      </AppText>
                      <View style={styles.amenityOptions}>
                        {catalog.localities.map((locality) => (
                          <Pressable
                            key={locality.id}
                            accessibilityRole="radio"
                            accessibilityState={{
                              checked: localityId === locality.id,
                            }}
                            onPress={() => setLocalityId(locality.id)}
                            style={({ pressed }) => [
                              styles.amenityOption,
                              localityId === locality.id &&
                                styles.amenityOptionSelected,
                              pressed && styles.pressed,
                            ]}
                          >
                            <AppText
                              variant="caption"
                              color={
                                localityId === locality.id
                                  ? colors.white
                                  : colors.primary
                              }
                            >
                              {locality.name}
                            </AppText>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <Input
                      label="Dirección"
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Calle y número"
                      maxLength={255}
                    />
                    <View style={styles.coordinateRow}>
                      <Input
                        label="Latitud"
                        value={latitude}
                        onChangeText={setLatitude}
                        placeholder="-35.57"
                        keyboardType="numbers-and-punctuation"
                      />
                      <Input
                        label="Longitud"
                        value={longitude}
                        onChangeText={setLongitude}
                        placeholder="-58.01"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  </>
                ) : null}
                {category === 'desks' ? (
                  <View style={styles.amenityField}>
                    <AppText variant="caption" color={colors.primaryLight}>
                      Amenities
                    </AppText>
                    <View style={styles.amenityOptions}>
                      {catalog.amenities.map((amenity) => {
                        const selected = amenityIds.includes(amenity.id);
                        return (
                          <Pressable
                            key={amenity.id}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            onPress={() =>
                              setAmenityIds((current) =>
                                current.includes(amenity.id)
                                  ? current.filter((id) => id !== amenity.id)
                                  : [...current, amenity.id],
                              )
                            }
                            style={({ pressed }) => [
                              styles.amenityOption,
                              selected && styles.amenityOptionSelected,
                              pressed && styles.pressed,
                            ]}
                          >
                            <AppText
                              variant="caption"
                              color={
                                selected ? colors.white : colors.primary
                              }
                            >
                              {amenity.name}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
                <View style={styles.actions}>
                  {editing ? (
                    <Button
                      title="Cancelar"
                      variant="ghost"
                      onPress={startCreate}
                    />
                  ) : null}
                  <Button
                    title={editing ? 'Guardar cambios' : 'Crear'}
                    disabled={
                      catalog.isSaving ||
                      !name.trim() ||
                      (category !== 'amenities' &&
                        category !== 'localities' &&
                        category !== 'workAreas' &&
                        (!Number.isInteger(Number(capacity)) ||
                          Number(capacity) < 1)) ||
                      (category === 'workAreas' && !localityId) ||
                      (category === 'desks' && !areaId)
                    }
                    onPress={() => void handleSave()}
                  />
                </View>
              </Card>

              {catalog.isLoading ? (
                <Card>
                  <AppText variant="body" color={colors.primaryLight}>
                    Cargando elementos del sistema...
                  </AppText>
                </Card>
              ) : items.length === 0 ? (
                <Card>
                  <AppText variant="body" color={colors.primaryLight}>
                    No hay elementos registrados en esta categoría.
                  </AppText>
                </Card>
              ) : (
                <View style={styles.list}>
                  {visibleItems.map((item) => (
                    <Card key={item.id} style={styles.itemCard}>
                      <View style={styles.itemInfo}>
                        <AppText variant="subtitle" color={colors.primary}>
                          {itemName(item)}
                        </AppText>
                        {'peopleCapacity' in item ? (
                          <AppText variant="caption" color={colors.primaryLight}>
                            Capacidad: {item.peopleCapacity}
                          </AppText>
                        ) : null}
                      </View>
                      <View style={styles.actions}>
                        <Button
                          title="Editar"
                          variant="ghost"
                          onPress={() => startEdit(item)}
                        />
                        <Button
                          title="Eliminar"
                          variant="ghost"
                          onPress={() => setDeleting(item)}
                        />
                      </View>
                    </Card>
                  ))}
                </View>
              )}
              {items.length > 9 ? (
                <View style={styles.pagination}>
                  <Button
                    title="Anterior"
                    variant="ghost"
                    disabled={page === 1}
                    onPress={() => setPage((current) => current - 1)}
                  />
                  <AppText variant="caption" color={colors.primaryLight}>
                    Página {page} de {totalPages}
                  </AppText>
                  <Button
                    title="Siguiente"
                    variant="ghost"
                    disabled={page === totalPages}
                    onPress={() => setPage((current) => current + 1)}
                  />
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        <BottomTabBar
          activeTab="catalog"
          onPressAdminCatalog={props.onPressAdminCatalog}
          onPressUserManagement={props.onPressUserManagement}
          onPressProfile={props.onPressProfile}
          onPressLogout={props.onPressLogout}
          onPressSwitchAccount={props.onPressSwitchAccount}
          onPressChangePassword={props.onPressChangePassword}
        />
      </View>

      <ConfirmModal
        visible={deleting !== null}
        title={deleteTitle}
        description={
          deleting
            ? `Se eliminará ${itemName(deleting)}. Esta acción requiere confirmación.`
            : undefined
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Volver"
        destructive
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleting(null)}
      />
      <StatusModal
        visible={Boolean(catalog.successMessage)}
        type="success"
        title="Acción completada"
        description={catalog.successMessage ?? undefined}
        onClose={catalog.clearFeedback}
      />
      <StatusModal
        visible={Boolean(catalog.errorMessage)}
        type="error"
        title="No pudimos completar la acción"
        description={
          catalog.errorMessage ??
          'Lo sentimos, intente nuevamente en unos instantes.'
        }
        onClose={catalog.clearFeedback}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  layout: { flex: 1, gap: spacing.md },
  content: { gap: spacing.xl, paddingBottom: spacing.md },
  heading: { gap: spacing.xs },
  grid: { gap: spacing.md },
  categoryCard: { gap: spacing.sm, minHeight: 110 },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formCard: { gap: spacing.md },
  list: { gap: spacing.md },
  itemCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  itemInfo: { flex: 1, gap: spacing.xs },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  amenityField: { gap: spacing.sm },
  fieldGroup: { gap: spacing.sm },
  label: { fontWeight: '700' },
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
  chipText: { fontWeight: '800' },
  amenityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityOption: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  amenityOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  coordinateRow: { gap: spacing.md },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.8 },
});
