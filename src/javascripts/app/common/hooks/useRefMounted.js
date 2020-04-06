import { useRef, useEffect } from 'react';

export function useRefMounted() {
  const refMounted = useRef(false);

  useEffect(() => {
    refMounted.current = true;

    return () => {
      refMounted.current = false;
    };
  });

  return refMounted;
}
