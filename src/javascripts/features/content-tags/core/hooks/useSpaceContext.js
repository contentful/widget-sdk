import { getModule } from 'core/NgRegistry';
import { useMemo } from 'react';

const useSpaceContext = () => {
  return useMemo(() => getModule('spaceContext'), []);
};

export { useSpaceContext };
