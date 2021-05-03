// TODO: Move the Redux state proptypes to a different file, closer to Redux
//
// We don't have a convention now so they will live here

import PropTypes from 'prop-types';

export const IdentityProviderPropType = PropTypes.shape({
  ssoName: PropTypes.string,
  idpSsoTargetUrl: PropTypes.string,
  idpCert: PropTypes.string,
  idpName: PropTypes.string,
});
