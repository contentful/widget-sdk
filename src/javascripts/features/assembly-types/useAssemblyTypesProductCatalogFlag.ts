import { useState, useEffect } from 'react';

import { fetchAssemblyTypesProductCatalogFlag } from './fetchAssemblyTypesProductCatalogFlag';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

export const useAssemblyTypesProductCatalogFlag = () => {
  const [flag, setFlag] = useState(false);
  const { currentSpaceId: spaceId } = useSpaceEnvContext();

  useEffect(() => {
    if (!spaceId) {
      return;
    }

    // This fetch function takes care of caching the product catalog
    // flag internally, as it's used also in non-react modules
    fetchAssemblyTypesProductCatalogFlag(spaceId).then((productCatalogFlag) =>
      setFlag(productCatalogFlag)
    );
  }, [spaceId]);

  return flag;
};
