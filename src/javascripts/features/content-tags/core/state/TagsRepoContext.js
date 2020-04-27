import * as React from 'react';

const TagsRepoContext = React.createContext({
  createTag: null,
  readTags: null,
  updateTag: null,
  deleteTag: null,
});

export { TagsRepoContext };
