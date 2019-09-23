import PropTypes from 'prop-types';

export const User = PropTypes.shape({
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  avatarUrl: PropTypes.string,
  email: PropTypes.string,
  identities: PropTypes.array,
  sys: PropTypes.shape({ version: PropTypes.number })
});
