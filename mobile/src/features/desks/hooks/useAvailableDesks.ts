import { useCallback, useEffect, useState } from 'react';

import { DeskServiceError, getAvailableDesks } from '../services/desks.service';
import { Desk, DeskZone } from '../types/desk.types';

type UseAvailableDesksParams = {
  date: string;
  startTime: string;
  endTime: string;
  zone?: DeskZone;
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
  refreshKey = 0,
}: UseAvailableDesksParams) {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadDesks = useCallback(() => {
    let isMounted = true;

    setIsLoading(true);
    setErrorMessage(null);

    getAvailableDesks({ date, startTime, endTime, zone })
      .then((availableDesks) => {
        if (!isMounted) {
          return;
        }

        setDesks(availableDesks);
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setDesks([]);
        setErrorMessage(getFriendlyErrorMessage(error));
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [date, endTime, startTime, zone]);

  useEffect(() => loadDesks(), [loadDesks, refreshKey]);

  return {
    desks,
    errorMessage,
    isLoading,
    refresh: loadDesks,
  };
}
