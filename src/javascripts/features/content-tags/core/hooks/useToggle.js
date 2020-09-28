import { useCallback, useState } from 'react';

function useToggle(initialState = false) {
  const [state, setState] = useState(initialState);
  const toggle = useCallback(() => setState((currentState) => !currentState), []);

  return [state, toggle];
}

export { useToggle };
