import * as React from 'react';
import { useEffect, useState } from 'react';
import * as TagsRepo from 'data/CMA/TagsRepo';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { getModule } from 'core/NgRegistry';
import PropTypes from 'prop-types';

export const TagsRepoContext = React.createContext({
  createTag: null,
  readTags: null,
  updateTag: null,
  deleteTag: null,
});

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

TagsRepoProvider.propTypes = {
  enforceMock: PropTypes.bool,
};

export default TagsRepoProvider;
