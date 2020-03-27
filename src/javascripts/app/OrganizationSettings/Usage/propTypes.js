import PropTypes from 'prop-types';

const periodPropType = PropTypes.shape({
  sys: PropTypes.shape({
    type: PropTypes.oneOf(['UsagePeriod']).isRequired,
    id: PropTypes.string.isRequired,
  }),
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string,
});

const organizationResourceUsagePropType = PropTypes.shape({
  sys: PropTypes.shape({
    type: PropTypes.oneOf(['OrganizationPeriodicUsage', 'SpacePeriodicUsage']),
    space: PropTypes.shape({ sys: PropTypes.shape({ id: PropTypes.string.isRequired }) })
      .isRequired,
  }),
  usage: PropTypes.arrayOf(PropTypes.number).isRequired,
});

const organizationUsagePropType = PropTypes.shape({
  usage: PropTypes.arrayOf(PropTypes.number).isRequired,
});

const apiUsagePropType = PropTypes.shape({
  items: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
});

const periodicUsagePropType = PropTypes.shape({
  org: organizationUsagePropType.isRequired,
  apis: PropTypes.shape({
    cma: apiUsagePropType,
    cda: apiUsagePropType,
    cpa: apiUsagePropType,
    gql: apiUsagePropType,
  }).isRequired,
});

export { periodPropType, organizationResourceUsagePropType, periodicUsagePropType };
