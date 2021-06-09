import { useEffect, useState } from 'react';
import { ValidationError, ValidatorAPI } from '@contentful/editorial-primitives';
import deepEqual from 'fast-deep-equal';

function useDeepEqualState<S>(initialState: S | (() => S)): [S, (newState: S) => void] {
  const [state, setActualState] = useState(initialState);
  const setState = (newState: S) => {
    setActualState((previous) => {
      if (deepEqual(previous, newState)) {
        return previous;
      }

      return newState;
    });
  };

  return [state, setState];
}

export function useInitialValueDocumentErrors(validator: ValidatorAPI) {
  const [errors, setErrors] = useDeepEqualState<ValidationError[]>(() => []);

  useEffect(() => {
    return void validator.onErrors(setErrors);
  }, [validator]);

  return { errors };
}
