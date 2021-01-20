import { useReducer, useEffect, useCallback } from 'react';
import { useRefMounted } from './useRefMounted';

enum UseAsyncActionType {
  INIT,
  SUCCESS,
  FAILURE,
  RESET,
}

type UseAsyncState<T> = {
  isLoading: boolean;
  data?: T;
  error?: typeof Error;
};

type AsyncInitAction = {
  type: UseAsyncActionType.INIT;
};

type AsyncSuccessAction<T> = {
  type: UseAsyncActionType.SUCCESS;
  payload: T;
};

type AsyncFailureAction = {
  type: UseAsyncActionType.FAILURE;
  error: typeof Error;
};

type AsyncResetAction = {
  type: UseAsyncActionType.RESET;
};

type UseAsyncAction<T> =
  | AsyncInitAction
  | AsyncSuccessAction<T>
  | AsyncFailureAction
  | AsyncResetAction;

type AsyncFn<T, FnArgs extends unknown[] = []> = (...args: FnArgs) => Promise<T>;

function dataFetchReducer<T>(state: UseAsyncState<T>, action: UseAsyncAction<T>): UseAsyncState<T> {
  switch (action.type) {
    case UseAsyncActionType.INIT:
      return { isLoading: true };
    case UseAsyncActionType.SUCCESS:
      return { isLoading: false, data: action.payload };
    case UseAsyncActionType.FAILURE:
      return { isLoading: false, error: action.error };
    case UseAsyncActionType.RESET:
      return { isLoading: false, data: undefined, error: undefined };
    default:
      return state;
  }
}

/**
 * A hook for running an arbitrary asynchronous function multiple
 * times within a component's lifecycle.
 *
 * Returns an array with the state, a memoized function to call the provided
 * `fn` (which can take arguments of type `FnArgs`), and a reset function.
 *
 * The state is updated when the `runAsync` function is called, when `fn` resolves
 * or rejects, and when `reset` is called.
 *
 * @typeParam T - type of the resulting data
 * @typeParam FnArgs - type of the arguments passed to `runAsync`, if any.
 */
export function useAsyncFn<T, FnArgs extends unknown[] = []>(
  fn: AsyncFn<T, FnArgs>,
  isLoading = false
): [UseAsyncState<T>, (...args: FnArgs) => void, () => void] {
  const [state, dispatch] = useReducer<React.Reducer<UseAsyncState<T>, UseAsyncAction<T>>>(
    dataFetchReducer,
    {
      isLoading,
    }
  );

  const isMounted = useRefMounted();
  const runAsync = useCallback(
    async (...args: FnArgs) => {
      dispatch({ type: UseAsyncActionType.INIT });

      try {
        const data = await fn(...args);
        if (isMounted.current) dispatch({ type: UseAsyncActionType.SUCCESS, payload: data });
      } catch (error) {
        if (isMounted.current) dispatch({ type: UseAsyncActionType.FAILURE, error });
      }
    },
    [fn, isMounted]
  );

  return [state, runAsync, () => dispatch({ type: UseAsyncActionType.RESET })];
}

/**
 * Runs the given `fn`.
 *
 * Returns a state object that is updated when `fn` resolves or rejects.
 *
 * @typeParam T - type of the resulting data
 */
export function useAsync<T>(fn: AsyncFn<T>) {
  const [state, runAsync] = useAsyncFn<T>(fn, true);

  useEffect(() => {
    runAsync();
  }, [runAsync]);

  return state;
}
