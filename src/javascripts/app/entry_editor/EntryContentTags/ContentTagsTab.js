import * as React from 'react';
import PropTypes from 'prop-types';
import {
  EditorTagsSkeleton,
  ReadTagsProvider,
  TagsRepoProvider,
  useDocTags,
} from 'features/content-tags';

const ContentTagsTab = ({ doc }) => {
  const { tags, setTags } = useDocTags(doc);
  return (
    <TagsRepoProvider>
      <ReadTagsProvider>
        <EditorTagsSkeleton tags={tags} setTags={setTags} showEmpty={true} />
      </ReadTagsProvider>
    </TagsRepoProvider>
  );
};

ContentTagsTab.propTypes = {
  doc: PropTypes.object,
};

export { ContentTagsTab };
