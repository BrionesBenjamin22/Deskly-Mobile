import { useState } from 'react';

import { validateArrival } from '../services/reservations.service';

export type ArrivalActionStatus = 'idle' | 'loading' | 'success' | 'error';

export function useValidateArrival(
  accessToken: string,
  onValidated?: () => Promise<void> | void,
) {
  const [status, setStatus] = useState<ArrivalActionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async (reservationId: string): Promise<void> => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      await validateArrival(reservationId, accessToken);
      await onValidated?.();
      setStatus('success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : null);
      setStatus('error');
    }
  };

  return { status, errorMessage, submit, clearStatus: () => setStatus('idle') };
}
