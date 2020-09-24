import * as React from 'react';
import { useEffect, useState } from 'react';
import * as TagsRepo from 'features/content-tags/core/state/TagsRepo';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';
import { useSpaceContext } from 'features/content-tags/core/hooks';

function TagsRepoProvider({ children }) {
  const [tagsRepo, setTagsRepo] = useState({});
  const spaceContext = useSpaceContext();

  useEffect(() => {
    const spaceId = spaceContext.getId();
    const environmentId = spaceContext.getAliasId() || spaceContext.getEnvironmentId();
    const endpoint = createSpaceEndpoint(spaceId, environmentId);
    setTagsRepo(TagsRepo.create(endpoint, environmentId));
  }, [spaceContext]);

  if (!tagsRepo) {
    throw 'TagsRepo not initialized';
  }

  return <TagsRepoContext.Provider value={tagsRepo}>{children}</TagsRepoContext.Provider>;
}

export { TagsRepoProvider };
