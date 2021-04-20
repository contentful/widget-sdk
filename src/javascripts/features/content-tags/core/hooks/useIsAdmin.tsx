import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { isAdmin } from 'core/services/SpaceEnvContext/utils';

const useIsAdmin = (): boolean => {
  const { currentSpace } = useSpaceEnvContext();
  return isAdmin(currentSpace);
};

export { useIsAdmin };
