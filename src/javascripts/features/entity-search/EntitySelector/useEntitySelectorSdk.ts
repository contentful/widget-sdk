import { useMemo } from 'react';
import type { EntitySelectorExtensionSDK } from '@contentful/entity-search';
import { createAccessApi } from 'app/widgets/ExtensionSDKs/createAccessApi';
import { createLocalesApi } from 'app/widgets/ExtensionSDKs/createLocalesApi';
import { createEntityNavigatorApi } from 'app/widgets/ExtensionSDKs/createNavigatorApi';
import { useBaseSearchSdk } from '../useBaseSearchSdk';

export function useEntitySelectorSdk(): EntitySelectorExtensionSDK {
  const { space, cma } = useBaseSearchSdk();

  return useMemo(() => {
    const locales = createLocalesApi();
    const navigator = createEntityNavigatorApi({ cma });
    const access = createAccessApi(space);

    return {
      space,
      navigator,
      locales,
      access,
    };
  }, [space, cma]);
}
