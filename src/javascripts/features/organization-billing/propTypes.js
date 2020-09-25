import PropTypes from 'prop-types';

export const BillingDetailsPropType = PropTypes.shape({
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  workEmail: PropTypes.string,
  address1: PropTypes.string,
  address2: PropTypes.string,
  city: PropTypes.string,
  zipCode: PropTypes.string,
  state: PropTypes.string,
  country: PropTypes.string,
  vat: PropTypes.string,
});
