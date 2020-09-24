import PropTypes from 'prop-types';

const TagType = {
  Default: 'Default',
  Access: 'Access',
};

const TagTypePropType = PropTypes.oneOf(Object.values(TagType));

const TagTypeAny = 'Any';
const TagTypeFilters = [TagTypeAny, ...Object.values(TagType)];

export { TagType, TagTypePropType, TagTypeAny, TagTypeFilters };
