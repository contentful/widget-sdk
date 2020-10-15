import React from 'react';
import { ReadTagsProvider } from 'features/content-tags/core/state/ReadTagsProvider';
import { TagsRepoProvider } from 'features/content-tags/core/state/TagsRepoProvider';
import { FilteredTagsProvider } from 'features/content-tags/core/state/FilteredTagsProvider';

const MetadataTags = ({ children }) => {
  return (
    <TagsRepoProvider>
      <ReadTagsProvider>
        <FilteredTagsProvider>{children}</FilteredTagsProvider>
      </ReadTagsProvider>
    </TagsRepoProvider>
  );
};

export { MetadataTags };
