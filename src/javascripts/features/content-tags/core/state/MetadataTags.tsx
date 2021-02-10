import { ConditionalWrapper } from 'features/content-tags/core/components/ConditionalWrapper';
import { FilteredTagsProvider } from 'features/content-tags/core/state/FilteredTagsProvider';
import { ReadTagsContext } from 'features/content-tags/core/state/ReadTagsContext';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';
import { TagsRepoProvider } from 'features/content-tags/core/state/TagsRepoProvider';
import React, { useContext } from 'react';
import { ReadTagsProvider } from 'features/content-tags/core/state/ReadTagsProvider';

const MetadataTags = ({ children }) => {
  const tagsRepo = useContext(TagsRepoContext);
  const readTags = useContext(ReadTagsContext);
  return (
    <ConditionalWrapper
      condition={tagsRepo === undefined}
      wrapper={(c) => <TagsRepoProvider>{c}</TagsRepoProvider>}>
      <ConditionalWrapper
        condition={readTags === undefined}
        wrapper={(c) => <ReadTagsProvider>{c}</ReadTagsProvider>}>
        <FilteredTagsProvider>{children}</FilteredTagsProvider>
      </ConditionalWrapper>
    </ConditionalWrapper>
  );
};

export { MetadataTags };
