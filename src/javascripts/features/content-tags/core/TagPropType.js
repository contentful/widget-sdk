import PropTypes from 'prop-types';
import { TagTypePropType } from 'features/content-tags/core/TagType';

const TagPropType = {
  name: PropTypes.string.isRequired,
  sys: PropTypes.shape({
    type: PropTypes.string.isRequired,
    tagType: TagTypePropType,
    id: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    version: PropTypes.number.isRequired,
  }),
  updatedAt: PropTypes.string,
};

export { TagPropType };
