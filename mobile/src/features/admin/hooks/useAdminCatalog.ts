import { useCallback, useEffect, useState } from 'react';

import {
  AmenityPayload,
  createAmenity,
  createDesk,
  createDeskDescription,
  createLocality,
  createWorkArea,
  deleteAmenity,
  deleteDesk,
  deleteDeskDescription,
  deleteLocality,
  deleteWorkArea,
  DeskDescriptionPayload,
  DeskPayload,
  DeskServiceError,
  listAmenities,
  listDeskDescriptions,
  listDesks,
  listLocalities,
  listWorkAreas,
  updateAmenity,
  updateDesk,
  updateDeskDescription,
  updateLocality,
  updateWorkArea,
  LocalityPayload,
  WorkAreaPayload,
} from '../../desks/services/desks.service';
import {
  Desk,
  DeskAmenity,
  DeskDescription,
  Locality,
  WorkArea,
} from '../../desks/types/desk.types';

function friendlyMessage(error: unknown) {
  return error instanceof DeskServiceError
    ? error.message
    : 'Lo sentimos, no pudimos procesar la solicitud. Intente nuevamente.';
}

export function useAdminCatalog(accessToken: string) {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [descriptions, setDescriptions] = useState<DeskDescription[]>([]);
  const [amenities, setAmenities] = useState<DeskAmenity[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [
        deskPage,
        descriptionList,
        amenityList,
        localityList,
        workAreaList,
      ] = await Promise.all([
        listDesks(1, 9),
        listDeskDescriptions(),
        listAmenities(),
        listLocalities(),
        listWorkAreas(),
      ]);
      setDesks(deskPage.desks);
      setDescriptions(descriptionList);
      setAmenities(amenityList);
      setLocalities(localityList);
      setWorkAreas(workAreaList);
    } catch (error) {
      setErrorMessage(friendlyMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mutate = async (action: () => Promise<unknown>, message: string) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await action();
      await load();
      setSuccessMessage(message);
      return true;
    } catch (error) {
      setErrorMessage(friendlyMessage(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    amenities,
    clearFeedback: () => {
      setErrorMessage(null);
      setSuccessMessage(null);
    },
    descriptions,
    desks,
    errorMessage,
    isLoading,
    isSaving,
    localities,
    successMessage,
    workAreas,
    saveDesk: (payload: DeskPayload, id?: string) =>
      mutate(
        () =>
          id
            ? updateDesk(id, payload, accessToken)
            : createDesk(payload, accessToken),
        id
          ? 'El escritorio se actualizó correctamente.'
          : 'El escritorio se creó correctamente.',
      ),
    removeDesk: (id: string) =>
      mutate(
        () => deleteDesk(id, accessToken),
        'El escritorio se eliminó correctamente.',
      ),
    saveAmenity: (payload: AmenityPayload, id?: string) =>
      mutate(
        () =>
          id
            ? updateAmenity(id, payload, accessToken)
            : createAmenity(payload, accessToken),
        id
          ? 'El amenity se actualizó correctamente.'
          : 'El amenity se creó correctamente.',
      ),
    removeAmenity: (id: string) =>
      mutate(
        () => deleteAmenity(id, accessToken),
        'El amenity se eliminó correctamente.',
      ),
    saveDescription: (payload: DeskDescriptionPayload, id?: string) =>
      mutate(
        () =>
          id
            ? updateDeskDescription(id, payload, accessToken)
            : createDeskDescription(payload, accessToken),
        id
          ? 'El tipo de escritorio se actualizó correctamente.'
          : 'El tipo de escritorio se creó correctamente.',
      ),
    removeDescription: (id: string) =>
      mutate(
        () => deleteDeskDescription(id, accessToken),
        'El tipo de escritorio se eliminó correctamente.',
      ),
    saveLocality: (payload: LocalityPayload, id?: string) =>
      mutate(
        () =>
          id
            ? updateLocality(id, payload, accessToken)
            : createLocality(payload, accessToken),
        id
          ? 'La localidad se actualizó correctamente.'
          : 'La localidad se creó correctamente.',
      ),
    removeLocality: (id: string) =>
      mutate(
        () => deleteLocality(id, accessToken),
        'La localidad se eliminó correctamente.',
      ),
    saveWorkArea: (payload: WorkAreaPayload, id?: string) =>
      mutate(
        () =>
          id
            ? updateWorkArea(id, payload, accessToken)
            : createWorkArea(payload, accessToken),
        id
          ? 'El área de trabajo se actualizó correctamente.'
          : 'El área de trabajo se creó correctamente.',
      ),
    removeWorkArea: (id: string) =>
      mutate(
        () => deleteWorkArea(id, accessToken),
        'El área de trabajo se eliminó correctamente.',
      ),
  };
}
