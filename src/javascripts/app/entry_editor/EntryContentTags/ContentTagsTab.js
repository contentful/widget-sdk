import * as React from 'react';
import PropTypes from 'prop-types';
import { EditorTagsSkeleton, MetadataTags, useDocTags } from 'features/content-tags';

const ContentTagsTab = ({ disable, getValueAt, setValueAt }) => {
  const { tags, setTags } = useDocTags({ getValueAt, setValueAt });
  return (
    <MetadataTags>
      <EditorTagsSkeleton disable={disable} tags={tags} setTags={setTags} showEmpty={true} />
    </MetadataTags>
  );
};

ContentTagsTab.propTypes = {
  disable: PropTypes.bool.isRequired,
  getValueAt: PropTypes.func.isRequired,
  setValueAt: PropTypes.func.isRequired,
};

export { ContentTagsTab };
