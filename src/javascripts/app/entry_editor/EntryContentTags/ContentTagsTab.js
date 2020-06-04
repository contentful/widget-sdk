import * as React from 'react';
import PropTypes from 'prop-types';
import {
  EditorTagsSkeleton,
  ReadTagsProvider,
  TagsRepoProvider,
  useDocTags,
} from 'features/content-tags';

const ContentTagsTab = ({ getValueAt, setValueAt }) => {
  const { tags, setTags } = useDocTags({ getValueAt, setValueAt });
  return (
    <TagsRepoProvider>
      <ReadTagsProvider>
        <EditorTagsSkeleton tags={tags} setTags={setTags} showEmpty={true} />
      </ReadTagsProvider>
    </TagsRepoProvider>
  );
};

ContentTagsTab.propTypes = {
  getValueAt: PropTypes.func.isRequired,
  setValueAt: PropTypes.func.isRequired,
};

export { ContentTagsTab };
