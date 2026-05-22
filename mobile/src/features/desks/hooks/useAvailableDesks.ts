import { useEffect, useState } from 'react';

import { DeskServiceError, getAvailableDesks } from '../services/desks.service';
import { Desk } from '../types/desk.types';

type UseAvailableDesksParams = {
  date: string;
  startTime: string;
  endTime: string;
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
}: UseAvailableDesksParams) {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setErrorMessage(null);

    getAvailableDesks({ date, startTime, endTime })
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
  }, [date, endTime, startTime]);

  return {
    desks,
    errorMessage,
    isLoading,
  };
}
