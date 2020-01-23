import { useEffect } from 'react';

const useGlobalMouseUp = handler => {
  useEffect(() => {
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, [handler]);
};

export default useGlobalMouseUp;
