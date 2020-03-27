import PropTypes from 'prop-types';
import { orgRoles } from 'utils/MembershipUtils';

export const Organization = PropTypes.shape({
  name: PropTypes.string.isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
});

export const User = PropTypes.shape({
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  avatarUrl: PropTypes.string.isRequired,
  confirmed: PropTypes.bool,
  activated: PropTypes.bool,
  email: PropTypes.string.isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
});

export const SpaceRole = PropTypes.shape({
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  permissions: PropTypes.object,
  policies: PropTypes.array,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
});

export const Link = PropTypes.shape({
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    linkType: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['Link']),
  }).isRequired,
});

export const Space = PropTypes.shape({
  name: PropTypes.string.isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
});

export const SpaceMembership = PropTypes.shape({
  admin: PropTypes.bool.isRequired,
  roles: PropTypes.arrayOf(PropTypes.oneOfType([SpaceRole, Link])).isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    space: PropTypes.oneOfType([Space, Link]).isRequired,
  }).isRequired,
});

export const OrganizationMembershipSSO = PropTypes.shape({
  isExemptFromRestrictedMode: PropTypes.bool.isRequired,
  lastSignInAt: PropTypes.string,
  exemptionReasons: PropTypes.arrayOf(PropTypes.string),
});

export const OrganizationMembership = PropTypes.shape({
  role: PropTypes.oneOf(orgRoles.map((role) => role.value)).isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    user: PropTypes.oneOfType([User, Link]),
    sso: OrganizationMembershipSSO,
  }).isRequired,
});

export const FilterOption = PropTypes.shape({
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
});

export const Filter = PropTypes.shape({
  label: PropTypes.string.isRequired,
  filter: PropTypes.shape({
    key: PropTypes.string.isRequired,
    operator: PropTypes.function,
    value: PropTypes.any,
  }).isRequired,
  options: PropTypes.arrayOf(FilterOption),
});

export const Team = PropTypes.shape({
  name: PropTypes.string.isRequired,
  memberCount: PropTypes.number,
  description: PropTypes.string,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
});

export const TeamMembership = PropTypes.shape({
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    user: PropTypes.shape({ id: PropTypes.string }),
  }).isRequired,
});

export const TeamSpaceMembership = PropTypes.shape({
  admin: PropTypes.bool.isRequired,
  roles: PropTypes.arrayOf(PropTypes.oneOfType([SpaceRole, Link])),
  sys: PropTypes.shape({
    space: PropTypes.oneOfType([Space, Link]),
    team: PropTypes.oneOfType([Team, Link]),
  }).isRequired,
});

export const SpaceMember = PropTypes.shape({
  admin: PropTypes.bool.isRequired,
  roles: PropTypes.arrayOf(PropTypes.oneOfType([SpaceRole, Link])).isRequired,
  relatedMemberships: PropTypes.arrayOf(
    PropTypes.oneOfType([SpaceMembership, TeamSpaceMembership, Link])
  ),
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    space: PropTypes.oneOfType([Space, Link]).isRequired,
  }).isRequired,
});

export const TeamSpaceMembershipPlaceholder = PropTypes.shape({
  sys: PropTypes.shape({
    id: PropTypes.oneOf(['placeholder']).isRequired,
  }).isRequired,
});
