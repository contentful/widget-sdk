import { useContext } from 'react';
import { SpaceEnvContext } from './SpaceEnvContext';

export function useSpaceEnvContext() {
  return useContext(SpaceEnvContext);
}
