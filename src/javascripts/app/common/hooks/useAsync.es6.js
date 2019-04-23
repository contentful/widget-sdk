import { useReducer, useEffect, useCallback } from 'react';
import useRefMounted from './useRefMounted.es6';

const ASYNC_INIT = 'ASYNC_INIT';
const ASYNC_SUCCESS = 'ASYNC_SUCCESS';
const ASYNC_FAILURE = 'ASYNC_FAILURE';

export const dataFetchReducer = (_, action) => {
  switch (action.type) {
    case ASYNC_INIT:
      return { isLoading: true };
    case ASYNC_SUCCESS:
      return { isLoading: false, data: action.payload };
    case ASYNC_FAILURE:
      return { isLoading: false, error: action.error };
  }
};

/**
 * Runs any given function that returns a promise.
 * Returns a new state on every of step the async operation
 * and a memoized function that will be used to start the async op.
 * @param {function(): Promise} fn
 */
export const useAsyncFn = fn => {
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false
  });
  const isMounted = useRefMounted();
  const runAsync = useCallback(async (...args) => {
    dispatch({ type: ASYNC_INIT });

    try {
      const data = await fn(...args);
      if (isMounted.current) dispatch({ type: ASYNC_SUCCESS, payload: data });
    } catch (error) {
      if (isMounted.current) dispatch({ type: ASYNC_FAILURE, error });
    }
  }, [fn, isMounted]);

  return [state, runAsync];
};

/**
 * Runs any given function that returns a promise
 * and a new state on every of the async operation
 * @param {function(): Promise} fn
 */
export default function useAsync(fn) {
  const [state, runAsync] = useAsyncFn(fn);

  useEffect(() => {
    runAsync();
  }, [runAsync]);

  return state;
}
