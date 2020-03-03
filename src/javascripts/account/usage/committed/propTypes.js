import PropTypes from 'prop-types';

const arrayPropType = itemPropType =>
  PropTypes.shape({
    total: PropTypes.number.isRequired,
    sys: PropTypes.shape({
      type: PropTypes.oneOf(['Array']).isRequired
    }).isRequired,
    items: PropTypes.arrayOf(itemPropType).isRequired
  });

const periodPropType = PropTypes.shape({
  sys: PropTypes.shape({
    type: PropTypes.oneOf(['UsagePeriod']).isRequired,
    id: PropTypes.string.isRequired
  }),
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string
});

const organizationUsagePropType = PropTypes.shape({
  usage: PropTypes.arrayOf(PropTypes.number).isRequired
});

const organizationResourceUsagePropType = PropTypes.shape({
  sys: PropTypes.shape({
    type: PropTypes.oneOf(['ApiUsage', 'SpacePeriodicUsage']),
    id: PropTypes.string,
    space: PropTypes.shape({ sys: PropTypes.shape({ id: PropTypes.string.isRequired }) }).isRequired
  }),
  usage: PropTypes.arrayOf(PropTypes.number).isRequired
});

const apiUsagePropType = PropTypes.shape({
  items: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired
});

const periodicUsagePropType = PropTypes.shape({
  org: organizationUsagePropType.isRequired,
  apis: PropTypes.shape({
    cma: apiUsagePropType,
    cda: apiUsagePropType,
    cpa: apiUsagePropType,
    gql: apiUsagePropType
  }).isRequired
});

export {
  arrayPropType,
  periodPropType,
  organizationUsagePropType,
  organizationResourceUsagePropType,
  periodicUsagePropType
};
