import * as React from 'react';
import PropTypes from 'prop-types';
import { EditorTagsSkeleton, MetadataTags, useDocTags } from 'features/content-tags';

const ContentTagsTab = ({ getValueAt, setValueAt }) => {
  const { tags, setTags } = useDocTags({ getValueAt, setValueAt });
  return (
    <MetadataTags>
      <EditorTagsSkeleton tags={tags} setTags={setTags} showEmpty={true} />
    </MetadataTags>
  );
};

ContentTagsTab.propTypes = {
  getValueAt: PropTypes.func.isRequired,
  setValueAt: PropTypes.func.isRequired,
};

export { ContentTagsTab };
