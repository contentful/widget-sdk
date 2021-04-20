import { useMemo } from 'react';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import { createSpaceApi } from 'app/widgets/ExtensionSDKs/createSpaceApi';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { useSpaceEnvContext, useContentTypes } from 'core/services/SpaceEnvContext';
import { createTagsRepo } from 'features/content-tags';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import createUsersCache from 'data/userCache';

export function useBaseSearchSdk() {
  const { client: cma } = useCurrentSpaceAPIClient();
  const { currentSpaceId = '', currentEnvironmentId = '' } = useSpaceEnvContext();
  const { currentSpaceContentTypes } = useContentTypes();

  return useMemo(() => {
    const spaceEndpoint = createSpaceEndpoint(currentSpaceId, currentEnvironmentId);
    const usersRepo = createUsersCache(spaceEndpoint);
    const tagsRepo = createTagsRepo(spaceEndpoint, currentEnvironmentId);

    if (!cma) {
      throw new Error('APIClient should be initialized to use EntitySelectorSdk');
    }

    const space = createSpaceApi({
      cma: getBatchingApiClient(cma),
      initialContentTypes: currentSpaceContentTypes ?? [],
      environmentIds: [],
      spaceId: currentSpaceId,
      tagsRepo,
      usersRepo,
    });

    return {
      space: {
        ...space,
        getTags: () => tagsRepo.readTags(0, 10000),
      },
      cma,
    };
  }, [currentEnvironmentId, currentSpaceId, cma, currentSpaceContentTypes]);
}
