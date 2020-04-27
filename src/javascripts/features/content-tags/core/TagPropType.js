import PropTypes from 'prop-types';

const TagPropType = {
  name: PropTypes.string.isRequired,
  sys: PropTypes.shape({
    type: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    version: PropTypes.number.isRequired,
  }),
  entriesTagged: PropTypes.number,
  assetsTagged: PropTypes.number,
  updatedAt: PropTypes.string,
};

export { TagPropType };
