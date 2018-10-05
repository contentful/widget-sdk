import PropTypes from 'prop-types';

const arrayPropType = itemType =>
  PropTypes.shape({
    total: PropTypes.number.isRequired,
    sys: PropTypes.shape({
      type: PropTypes.oneOf(['Array']).isRequired,
      id: PropTypes.string.isRequired
    }).isRequired,
    items: PropTypes.arrayOf(itemType).isRequired
  });

const periodPropType = PropTypes.shape({
  sys: PropTypes.shape({
    type: PropTypes.oneOf(['UsagePeriod']).isRequired,
    id: PropTypes.string.isRequired
  }),
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string
});

const organizationUsagePropType = arrayPropType(
  PropTypes.shape({
    usage: PropTypes.arrayOf(PropTypes.number).isRequired
  })
);

const organizationResourceUsagePropType = PropTypes.shape({
  sys: PropTypes.shape({
    type: PropTypes.oneOf(['cmaUsage', 'cpaUsage', 'cdaUsage']).isRequired,
    id: PropTypes.string.isRequired,
    space: PropTypes.shape({ sys: PropTypes.shape({ id: PropTypes.string.isRequired }) }).isRequired
  }),
  usage: PropTypes.arrayOf(PropTypes.number).isRequired
});

export {
  arrayPropType,
  periodPropType,
  organizationUsagePropType,
  organizationResourceUsagePropType
};
