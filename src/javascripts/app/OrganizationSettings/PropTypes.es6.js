import PropTypes from 'prop-types';
import { orgRoles } from './Users/UserDetail/OrgRoles.es6';

export const User = PropTypes.shape({
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  avatarUrl: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired
  })
});

export const Space = PropTypes.shape({
  name: PropTypes.string.isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired
});

export const SpaceMembership = PropTypes.shape({
  admin: PropTypes.bool.isRequired,
  roles: PropTypes.array.isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    space: Space.isRequired
  }).isRequired
});

export const OrganizationMembership = PropTypes.shape({
  role: PropTypes.oneOf(orgRoles.map(role => role.value)).isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    user: User.isRequired
  })
});

export const FilterOption = PropTypes.shape({
  label: PropTypes.string.isRequired,
  value: PropTypes.any
});

export const Filter = PropTypes.shape({
  label: PropTypes.string.isRequired,
  filter: PropTypes.shape({
    key: PropTypes.string.isRequired,
    operator: PropTypes.string,
    value: PropTypes.any
  }).isRequired,
  options: PropTypes.arrayOf(FilterOption)
});

export const SpaceRole = PropTypes.shape({
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  permissions: PropTypes.object,
  policies: PropTypes.array,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired
});

export const Team = PropTypes.shape({
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired
});
