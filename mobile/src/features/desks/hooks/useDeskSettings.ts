import { useCallback, useEffect, useState } from 'react';

import {
  createDesk,
  deleteDesk,
  DeskPayload,
  DeskServiceError,
  listAmenities,
  listDeskDescriptions,
  listDesks,
  updateDesk,
} from '../services/desks.service';
import { Desk, DeskAmenity, DeskDescription } from '../types/desk.types';

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof DeskServiceError) {
    return error.message;
  }

  return 'Lo sentimos, no pudimos procesar la solicitud. Intente nuevamente.';
}

export function useDeskSettings() {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [descriptions, setDescriptions] = useState<DeskDescription[]>([]);
  const [amenities, setAmenities] = useState<DeskAmenity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [desksResponse, descriptionsResponse, amenitiesResponse] =
        await Promise.all([
          listDesks(1, 9),
          listDeskDescriptions(),
          listAmenities(),
        ]);

      setDesks(desksResponse.desks);
      setDescriptions(descriptionsResponse);
      setAmenities(amenitiesResponse);
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const saveDesk = async (payload: DeskPayload, deskId?: string) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (deskId) {
        await updateDesk(deskId, payload);
        setSuccessMessage('Escritorio actualizado correctamente.');
      } else {
        await createDesk(payload);
        setSuccessMessage('Escritorio creado correctamente.');
      }

      await loadSettings();
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const removeDesk = async (deskId: string) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteDesk(deskId);
      setSuccessMessage('Escritorio dado de baja correctamente.');
      await loadSettings();
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    amenities,
    descriptions,
    desks,
    errorMessage,
    isLoading,
    isSaving,
    refresh: loadSettings,
    removeDesk,
    saveDesk,
    successMessage,
  };
}
