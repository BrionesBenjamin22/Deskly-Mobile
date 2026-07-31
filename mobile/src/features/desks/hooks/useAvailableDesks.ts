import { useCallback, useEffect, useRef, useState } from 'react';

import { DeskServiceError, getAvailableDesks } from '../services/desks.service';
import { Desk, DeskZone } from '../types/desk.types';

type UseAvailableDesksParams = {
  date: string;
  startTime: string;
  endTime: string;
  zone?: DeskZone;
  areaId?: string;
  localityId?: string;
  refreshKey?: number;
};

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof DeskServiceError) {
    return error.message;
  }

  return 'Lo sentimos, no pudimos recuperar su información. Intente nuevamente.';
}

export function useAvailableDesks({
  date,
  startTime,
  endTime,
  zone,
  areaId,
  localityId,
  refreshKey = 0,
}: UseAvailableDesksParams) {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const loadDesks = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const availableDesks = await getAvailableDesks({
        date,
        startTime,
        endTime,
        zone,
        areaId,
        localityId,
      });
      if (requestId !== requestIdRef.current) return;
      setDesks(availableDesks);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setDesks([]);
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [areaId, date, endTime, localityId, startTime, zone]);

  useEffect(() => {
    void loadDesks();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadDesks, refreshKey]);

  return {
    desks,
    errorMessage,
    isLoading,
    refresh: loadDesks,
  };
}
