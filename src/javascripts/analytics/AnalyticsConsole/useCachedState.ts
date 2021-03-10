import * as React from 'react';

// Persist state between recreation of dom element
const cache = {};
export const useCachedState = <T extends unknown>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = React.useState<T>(cache[key] ?? defaultValue);
  const setCachedState = React.useCallback(
    (newValue: React.SetStateAction<T>) => {
      cache[key] = newValue;
      setState(newValue);
    },
    [key]
  );
  return [state, setCachedState];
};
