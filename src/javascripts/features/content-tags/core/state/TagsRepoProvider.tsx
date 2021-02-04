import * as React from 'react';
import { useMemo } from 'react';
import * as TagsRepo from 'features/content-tags/core/state/TagsRepo';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

type Props = React.PropsWithChildren<{}>;

const TagsRepoProvider: React.FC<Props> = ({ children }) => {
  const { currentEnvironmentId, currentSpaceId } = useSpaceEnvContext();

  const tagsRepo = useMemo(() => {
    if (currentSpaceId && currentEnvironmentId) {
      const endpoint = createSpaceEndpoint(currentSpaceId, currentEnvironmentId);
      return TagsRepo.create(endpoint, currentEnvironmentId);
    } else {
      throw 'Can not initialize Tags repo, spaceId and/or environmentId missing';
    }
  }, [currentEnvironmentId, currentSpaceId]);

  if (!tagsRepo) {
    throw 'TagsRepo not initialized';
  }

  return <TagsRepoContext.Provider value={tagsRepo}>{children}</TagsRepoContext.Provider>;
};

export { TagsRepoProvider };
