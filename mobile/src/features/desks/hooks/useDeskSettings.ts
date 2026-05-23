import { useCallback, useEffect, useState } from 'react';

import {
  AmenityPayload,
  createAmenity,
  createDesk,
  deleteAmenity,
  deleteDesk,
  DeskPayload,
  DeskServiceError,
  listAmenities,
  listDeskDescriptions,
  listDesks,
  updateAmenity,
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

  useEffect(() => {
    if (!errorMessage && !successMessage) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setErrorMessage(null);
      setSuccessMessage(null);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [errorMessage, successMessage]);

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
        setSuccessMessage('Los cambios del escritorio se guardaron correctamente.');
      } else {
        await createDesk(payload);
        setSuccessMessage('El escritorio se creo correctamente.');
      }

      await loadSettings();
      return true;
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
      return false;
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

  const saveAmenity = async (payload: AmenityPayload, amenityId?: string) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (amenityId) {
        await updateAmenity(amenityId, payload);
        setSuccessMessage('Los cambios del amenity se guardaron correctamente.');
      } else {
        await createAmenity(payload);
        setSuccessMessage('El amenity se creo correctamente.');
      }

      await loadSettings();
      return true;
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const removeAmenity = async (amenityId: string) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteAmenity(amenityId);
      setSuccessMessage('Amenities eliminado correctamente.');
      await loadSettings();
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
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
    refresh: loadSettings,
    removeAmenity,
    removeDesk,
    saveAmenity,
    saveDesk,
    successMessage,
  };
}
