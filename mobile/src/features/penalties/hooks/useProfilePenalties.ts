import { useCallback, useEffect, useState } from 'react';

import { listCurrentUserPenalties } from '../services/penalties.service';
import { Penalty } from '../types/penalty.types';

export function useProfilePenalties(accessToken: string) {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await listCurrentUserPenalties(accessToken, 1, 3);
      setPenalties(response.penalties);
      setTotal(response.pagination.total);
    } catch (error) {
      setPenalties([]);
      setTotal(0);
      setErrorMessage(error instanceof Error ? error.message : null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { void load(); }, [load]);

  return { penalties, total, isLoading, errorMessage, refresh: load };
}
