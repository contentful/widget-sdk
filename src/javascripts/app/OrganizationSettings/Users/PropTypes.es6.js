import PropTypes from 'prop-types';
import { orgRoles } from './UserDetail/OrgRoles.es6';

export const User = PropTypes.shape({
  firstName: PropTypes.string.isRequired,
  lastName: PropTypes.string.isRequired,
  avatarUrl: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired
  })
});

export const SpaceMembership = PropTypes.shape({
  admin: PropTypes.bool.isRequired,
  roles: PropTypes.array.isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    space: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired
      }).isRequired
    }).isRequired
  }).isRequired
});

export const OrganizationMembership = PropTypes.shape({
  role: PropTypes.oneOf(orgRoles.map(role => role.value)).isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    user: User.isRequired
  })
});
