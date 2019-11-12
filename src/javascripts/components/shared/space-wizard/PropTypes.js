import PropTypes from 'prop-types';

export const partnershipMeta = PropTypes.shape({
  isPartnersSpacePlan: PropTypes.bool,
  fields: PropTypes.shape({
    clientName: PropTypes.string,
    description: PropTypes.string,
    estimatedDeliveryDate: PropTypes.string
  })
});
