import { render, screen } from '@testing-library/react';
import { MetadataTags } from 'features/content-tags/core/state/MetadataTags';
import React, { useContext } from 'react';
import { TagsRepoContext } from 'features/content-tags/core/state/TagsRepoContext';

const TagsRepoTest = () => {
  const tagsRepo = useContext(TagsRepoContext);
  const isInitialized = typeof tagsRepo?.readTags === 'function';
  return <p>{isInitialized ? 'isInitialized' : 'notInitialized'}</p>;
};

it('wraps with tags repo provider', () => {
  const defaultTagsRepo = {
    createTag: jest.fn().mockResolvedValue(true),
    readTags: jest.fn().mockResolvedValue({ total: 0, items: [] }),
    updateTag: jest.fn().mockResolvedValue(true),
    deleteTag: jest.fn().mockResolvedValue(true),
  };

  render(
    <TagsRepoContext.Provider value={defaultTagsRepo}>
      <MetadataTags>
        <TagsRepoTest />
      </MetadataTags>
    </TagsRepoContext.Provider>
  );

  expect(screen.getByText(/isInitialized/)).toBeInTheDocument();
});
