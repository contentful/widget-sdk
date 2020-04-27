import * as React from 'react';
import { useEffect, useState } from 'react';
import * as TagsRepo from 'data/CMA/TagsRepo';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { getModule } from 'core/NgRegistry';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';

function TagsRepoProvider({ children }) {
  const [tagsRepo, setTagsRepo] = useState({});

  useEffect(() => {
    const spaceContext = getModule('spaceContext');
    const spaceId = spaceContext.getId();
    const environmentId = spaceContext.getEnvironmentId();
    const endpoint = createSpaceEndpoint(spaceId, environmentId);
    setTagsRepo(TagsRepo.create(endpoint, environmentId));
  }, []);

  if (!tagsRepo) {
    throw 'TagsRepo not initialized';
  }

  return <TagsRepoContext.Provider value={tagsRepo}>{children}</TagsRepoContext.Provider>;
}

export { TagsRepoProvider };
