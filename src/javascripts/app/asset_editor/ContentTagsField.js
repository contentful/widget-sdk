import * as React from 'react';
import PropTypes from 'prop-types';
import { EditorTagsSkeleton, MetadataTags, useDocTags } from 'features/content-tags';

const ContentTagsField = ({ disable, getValueAt, setValueAt }) => {
  const { tags, setTags } = useDocTags({ getValueAt, setValueAt });
  return (
    <MetadataTags>
      <EditorTagsSkeleton disable={disable} showEmpty={false} tags={tags} setTags={setTags} />
    </MetadataTags>
  );
};

ContentTagsField.propTypes = {
  disable: PropTypes.bool.isRequired,
  getValueAt: PropTypes.func.isRequired,
  setValueAt: PropTypes.func.isRequired,
};

export default ContentTagsField;
