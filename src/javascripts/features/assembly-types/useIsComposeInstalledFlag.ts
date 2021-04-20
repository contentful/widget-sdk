import { useState, useEffect } from 'react';

import { checkComposeIsInstalled } from './checkComposeIsInstalled';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';

export const useIsComposeInstalledFlag = () => {
  const [flag, setFlag] = useState(false);
  const { currentSpaceId: spaceId } = useSpaceEnvContext();

  useEffect(() => {
    if (!spaceId) {
      return;
    }

    // This fetch function takes care of caching the product catalog
    // flag internally, as it's used also in non-react modules
    checkComposeIsInstalled(spaceId).then((isComposeInstalled) => setFlag(isComposeInstalled));
  }, [spaceId]);

  return flag;
};
