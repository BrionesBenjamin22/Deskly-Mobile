import { useCallback, useRef, useState } from 'react';

export function usePullToRefresh(refresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);

  const onRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      await refresh();
    } catch {
      // La pantalla conserva el manejo de error de su carga existente.
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [refresh]);

  return { isRefreshing, onRefresh };
}
