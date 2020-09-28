import { Tag } from '@contentful/forma-36-react-components';
import React from 'react';
import { TagType, TagTypePropType } from 'features/content-tags/core/TagType';

const typeMapping = {
  [TagType.Default]: 'primary',
  [TagType.Access]: 'positive',
};

const TagTypeLabel = ({ tagType }) => {
  if (!tagType) {
    tagType = TagType.Default;
  }
  return <Tag tagType={typeMapping[tagType]}>{tagType}</Tag>;
};

TagTypeLabel.propTypes = {
  tagType: TagTypePropType,
};

export { TagTypeLabel };
