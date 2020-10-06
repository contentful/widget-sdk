import * as React from 'react';
import PropTypes from 'prop-types';
import {
  EditorTagsSkeleton,
  ReadTagsProvider,
  TagsRepoProvider,
  useDocTags,
} from 'features/content-tags';

const ContentTagsField = ({ getValueAt, setValueAt, show }) => {
  const { tags, setTags } = useDocTags({ getValueAt, setValueAt });
  return show ? (
    <TagsRepoProvider>
      <ReadTagsProvider>
        <EditorTagsSkeleton showEmpty={false} tags={tags} setTags={setTags} />
      </ReadTagsProvider>
    </TagsRepoProvider>
  ) : null;
};

ContentTagsField.propTypes = {
  getValueAt: PropTypes.func.isRequired,
  setValueAt: PropTypes.func.isRequired,
  show: PropTypes.bool,
};

export default ContentTagsField;
