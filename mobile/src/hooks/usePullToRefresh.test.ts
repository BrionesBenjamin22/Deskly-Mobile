import { act, renderHook } from '@testing-library/react-native';

import { usePullToRefresh } from './usePullToRefresh';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
}

describe('usePullToRefresh', () => {
  it('mantiene el indicador activo hasta completar la recarga', async () => {
    const refresh = deferred<void>();
    const callback = jest.fn(() => refresh.promise);
    const { result } = renderHook(() => usePullToRefresh(callback));

    let request!: Promise<void>;
    act(() => {
      request = result.current.onRefresh();
    });

    expect(result.current.isRefreshing).toBe(true);
    expect(callback).toHaveBeenCalledTimes(1);

    await act(async () => {
      refresh.resolve();
      await request;
    });

    expect(result.current.isRefreshing).toBe(false);
  });

  it('detiene el indicador cuando la recarga falla', async () => {
    const refresh = deferred<void>();
    const { result } = renderHook(() =>
      usePullToRefresh(() => refresh.promise),
    );

    let request!: Promise<void>;
    act(() => {
      request = result.current.onRefresh();
    });

    await act(async () => {
      refresh.reject(new Error('network error'));
      await request;
    });

    expect(result.current.isRefreshing).toBe(false);
  });
});
