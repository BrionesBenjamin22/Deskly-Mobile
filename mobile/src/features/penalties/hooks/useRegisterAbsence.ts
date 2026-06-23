import { useState } from 'react';

import { registerAbsence } from '../services/penalties.service';
import { validatePenaltyReason } from '../validation/penalty.validation';

export type PenaltyActionStatus = 'idle' | 'loading' | 'success' | 'error';

export function useRegisterAbsence(accessToken: string, onRegistered?: () => Promise<void> | void) {
  const [status, setStatus] = useState<PenaltyActionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async (reservationId: string, reason: string): Promise<boolean> => {
    const validationError = validatePenaltyReason(reason);
    if (validationError) {
      setErrorMessage(validationError);
      setStatus('error');
      return false;
    }

    setStatus('loading');
    setErrorMessage(null);
    try {
      await registerAbsence(accessToken, { reservationId, reason });
      await onRegistered?.();
      setStatus('success');
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : null);
      setStatus('error');
      return false;
    }
  };

  return { status, errorMessage, submit, clearStatus: () => setStatus('idle') };
}
