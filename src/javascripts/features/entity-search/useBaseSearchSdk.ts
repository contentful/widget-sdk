import { useMemo } from 'react';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import { createSpaceApi } from 'app/widgets/ExtensionSDKs/createSpaceApi';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { createTagsRepo } from 'features/content-tags';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import createUsersCache from 'data/userCache';

export function useBaseSearchSdk() {
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
