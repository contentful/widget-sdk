import * as React from 'react';
import { useEffect, useState } from 'react';
import * as TagsRepo from 'features/content-tags/core/state/TagsRepo';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

function TagsRepoProvider({ children }) {
  const [tagsRepo, setTagsRepo] = useState({});
  const { currentEnvironmentId, currentSpaceId } = useSpaceEnvContext();

  useEffect(() => {
    const endpoint = createSpaceEndpoint(currentSpaceId, currentEnvironmentId);
    setTagsRepo(TagsRepo.create(endpoint, currentEnvironmentId));
  }, [currentEnvironmentId, currentSpaceId]);

  if (!tagsRepo) {
    throw 'TagsRepo not initialized';
  }

  return <TagsRepoContext.Provider value={tagsRepo}>{children}</TagsRepoContext.Provider>;
}

export { TagsRepoProvider };
