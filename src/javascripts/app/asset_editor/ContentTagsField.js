import * as React from 'react';
import PropTypes from 'prop-types';
import { EditorTagsSkeleton, MetadataTags, useDocTags } from 'features/content-tags';

const ContentTagsField = ({ getValueAt, setValueAt }) => {
  const { tags, setTags } = useDocTags({ getValueAt, setValueAt });
  return (
    <MetadataTags>
      <EditorTagsSkeleton showEmpty={false} tags={tags} setTags={setTags} />
    </MetadataTags>
  );
};

ContentTagsField.propTypes = {
  getValueAt: PropTypes.func.isRequired,
  setValueAt: PropTypes.func.isRequired,
};

export default ContentTagsField;
