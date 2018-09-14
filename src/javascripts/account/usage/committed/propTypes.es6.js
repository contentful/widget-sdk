import PropTypes from 'prop-types';

const arrayPropType = itemType =>
  PropTypes.shape({
    total: PropTypes.number,
    sys: PropTypes.shape({ type: PropTypes.oneOf(['Array']) }),
    items: PropTypes.arrayOf(itemType)
  });

const periodPropType = PropTypes.shape({
  sys: PropTypes.shape({
    type: PropTypes.string,
    id: PropTypes.string
  }),
  startDate: PropTypes.string,
  endDate: PropTypes.string
});

const organizationUsagePropType = PropTypes.shape({
  sys: PropTypes.shape({
    type: PropTypes.oneOf(['Array']),
    id: PropTypes.string
  }),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      usage: PropTypes.arrayOf(PropTypes.number)
    })
  )
});

const organizationResourceUsagePropType = PropTypes.shape({
  sys: PropTypes.shape({
    type: PropTypes.oneOf(['cmaUsage', 'cpaUsage', 'cdaUsage']),
    id: PropTypes.string,
    space: PropTypes.shape({ sys: PropTypes.shape({ id: PropTypes.string }) })
  }),
  usage: PropTypes.arrayOf(PropTypes.number)
});

export {
  arrayPropType,
  periodPropType,
  organizationUsagePropType,
  organizationResourceUsagePropType
};
