import PropTypes from 'prop-types';

const linkOf = types =>
  PropTypes.shape({
    sys: PropTypes.shape({
      linkType: Array.isArray(types) ? PropTypes.oneOf(types) : types,
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['Link'])
    })
  });

const Link = linkOf(PropTypes.string.isRequired);

export default {
  linkOf,
  Link
};
