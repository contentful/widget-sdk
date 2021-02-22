import { useMemo } from 'react';

import { EntitySelector, SearchFeatures } from '@contentful/entity-search';
import type { SearchSdk } from '@contentful/entity-search';
import { useEntitySelectorSdk } from './EntitySelector/useEntitySelectorSdk';
import { useBaseSearchSdk } from './useBaseSearchSdk';

export function useSearchSdk({
  features,
  customInputRenderers,
}: {
  features: SearchFeatures;
  customInputRenderers?: SearchSdk['customInputRenderers'];
}) {
  const { space } = useBaseSearchSdk();
  const entitySelectorSdk = useEntitySelectorSdk();

  const sdk = useMemo(
    () => ({
      customInputRenderers,
      getUsers: space.getUsers,
      getTags: space.getTags,
      openEntitySelectorFromField: (entityType, field) => {
        return EntitySelector.openFromLinkField(entitySelectorSdk, {
          entityType,
          field,
          features,
        });
      },
    }),
    [customInputRenderers, space, entitySelectorSdk, features]
  );

  return sdk;
}
