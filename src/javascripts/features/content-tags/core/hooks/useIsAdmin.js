import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isAdmin } from 'core/services/SpaceEnvContext/utils';

const useIsAdmin = () => {
  const { currentSpace } = useSpaceEnvContext();
  return isAdmin(currentSpace);
};

export { useIsAdmin };
