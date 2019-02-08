// TODO: Move the Redux state proptypes to a different file, closer to Redux
//
// We don't have a convention now so they will live here

import PropTypes from 'prop-types';

export const IdentityProviderPropType = PropTypes.shape({
  ssoName: PropTypes.string,
  idpSsoTargetUrl: PropTypes.string,
  idpCert: PropTypes.string,
  idpName: PropTypes.string
});

export const IdentityProviderStatePropType = PropTypes.shape({
  identityProvider: IdentityProviderPropType,
  isPending: PropTypes.bool,
  error: PropTypes.string
});

const makeFieldPropType = () =>
  PropTypes.shape({
    value: PropTypes.string,
    isPending: PropTypes.bool,
    error: PropTypes.string
  });

export const FieldsStatePropType = PropTypes.shape({
  idpName: makeFieldPropType(),
  ssoName: makeFieldPropType(),
  idpSsoTargetUrl: makeFieldPropType(),
  idpCert: makeFieldPropType()
});
