import { useMemo } from 'react';
import type { EntitySelectorExtensionSDK } from '@contentful/entity-search';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import { createAccessApi } from 'app/widgets/ExtensionSDKs/createAccessApi';
import { createLocalesApi } from 'app/widgets/ExtensionSDKs/createLocalesApi';
import { createEntityNavigatorApi } from 'app/widgets/ExtensionSDKs/createNavigatorApi';
import { createSpaceApi } from 'app/widgets/ExtensionSDKs/createSpaceApi';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { createTagsRepo } from 'features/content-tags';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import createUsersCache from 'data/userCache';

export function useEntitySelectorSdk(): EntitySelectorExtensionSDK {
  const cma = useCurrentSpaceAPIClient();
  const {
    currentSpaceId = '',
    currentEnvironmentId = '',
    currentSpaceContentTypes,
  } = useSpaceEnvContext();

  return useMemo(() => {
    const spaceEndpoint = createSpaceEndpoint(currentSpaceId, currentEnvironmentId);
    const usersRepo = createUsersCache(spaceEndpoint);
    const tagsRepo = createTagsRepo(spaceEndpoint, currentEnvironmentId);

    if (!cma) {
      throw new Error('APIClient should be initialized to use EntitySelectorSdk');
    }
    const locales = createLocalesApi();
    const entityNavigator = createEntityNavigatorApi({ cma });

    const space = createSpaceApi({
      cma: getBatchingApiClient(cma),
      initialContentTypes: currentSpaceContentTypes ?? [],
      environmentIds: [],
      spaceId: currentSpaceId,
      tagsRepo,
      usersRepo,
    });

    const access = createAccessApi(space);

    return {
      space: {
        ...space,
        getTags: () => {
          return tagsRepo.readTags(0, 10000);
        },
      },
      navigator: entityNavigator,
      locales,
      access,
    };
  }, [currentEnvironmentId, currentSpaceId, cma, currentSpaceContentTypes]);
}
