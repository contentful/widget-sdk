import { uniqueId } from 'lodash';

const DEFAULT_CREATED_AT_TIME_ISO = new Date('2020', '01', '20').toISOString();
export const CREATED_AT_TIME_DAY_MONTH_YEAR = '2020/01/20';

const types = {
  USER: 'User',
  SPACE: 'Space',
  ORGANIZATION: 'Organization',
  ROLE: 'Role',
  TEAM: 'Team',
  SPACE_MEMBER: 'SpaceMember',
  SPACE_MEMBERSHIP: 'SpaceMembership',
  ORGANIZATION_MEMBERSHIP: 'OrganizationMembership',
  TEAM_MEMBERSHIP: 'TeamMembership',
  TEAM_SPACE_MEMBERSHIP: 'TeamSpaceMembership',
};

export function sys(options = {}) {
  /**
   * Note: if type or id are defined in options, these default values are overwritten by the values in option.
   * For example, the returned object of calling sys({type: "TestType", id: "123"}) is: {type: "TestType", id: "123"}.
   * Not {type: '', id: 'uniqueId123'}
   * This is only true provided that `...options` is the last arguement in the returned object. Please keep it at the end.
   */

  return {
    type: '',
    id: uniqueId(options.type || ''),
    ...options,
  };
}

export function Link(linkType = '', id) {
  return {
    sys: {
      id: id || uniqueId(linkType.toLowerCase()),
      type: 'Link',
      linkType,
    },
  };
}

export function Space(options = {}) {
  return {
    name: uniqueId(types.SPACE),
    organization: Organization(),
    spaceMembership: SpaceMembership(),
    sys: sys({
      type: types.SPACE,
      id: uniqueId(types.SPACE),
      createdAt: DEFAULT_CREATED_AT_TIME_ISO,
      createdBy: User(),
    }),
    ...options,
  };
}

export function Organization(options = {}) {
  return {
    name: uniqueId(types.ORGANIZATION),
    sys: sys({
      type: types.ORGANIZATION,
      id: uniqueId(types.ORGANIZATION),
      createdAt: DEFAULT_CREATED_AT_TIME_ISO,
    }),
    ...options,
  };
}

export function User(options = {}) {
  return {
    firstName: 'John',
    lastName: 'Doe',
    email: `${options.firstName || 'John'}@example.com`,
    avatarUrl: 'avatar.jpg',
    activated: true,
    sys: sys({ type: types.USER }),
    ...options,
  };
}

export function Team(name = '', description = '') {
  return {
    name,
    description,
    sys: sys({ type: types.TEAM, organization: { sys: { id: 'aTeam1' } } }),
  };
}

export function Role(name = '', space = Link(types.SPACE)) {
  return {
    name,
    sys: {
      ...sys({ type: types.ROLE }),
      space,
    },
  };
}

export function SpaceMembership(
  space = Link(types.SPACE),
  user = User(),
  admin = true,
  roles = []
) {
  return {
    admin: admin,
    roles: roles,
    sys: {
      ...sys({ type: types.SPACE_MEMBERSHIP }),
      user: user,
      space: space,
      createdBy: Link(types.USER),
    },
  };
}

export function SpaceMember(
  space = Link(types.SPACE),
  user = Link(types.USER),
  admin = true,
  roles = []
) {
  const spaceMembershipLink = Link(types.SPACE_MEMBERSHIP);
  return {
    admin: admin,
    roles: roles,

    sys: {
      ...sys({ type: types.SPACE_MEMBER }),
      user: user,
      space: space,
      createdBy: Link(types.USER),
      relatedMemberships: [spaceMembershipLink],
    },
  };
}

export function OrganizationMembership(
  role = 'member',
  status = 'active',
  user = Link(types.USER)
) {
  return {
    role,
    sys: {
      ...sys({ type: types.ORGANIZATION_MEMBERSHIP }),
      status: status,
      user: user,
      createdBy: Link(types.USER),
    },
  };
}

export function TeamMembership(
  team = Link(types.TEAM),
  organizationMembership = Link(types.ORGANIZATION_MEMBERSHIP),
  user = Link(types.USER)
) {
  return {
    sys: {
      ...sys({ type: types.TEAM_MEMBERSHIP }),
      team,
      organizationMembership,
      user,
    },
  };
}

export function TeamSpaceMembership(
  team = Link(types.TEAM),
  space = Link(types.SPACE),
  roles = [],
  admin = true
) {
  return {
    roles,
    admin,
    sys: {
      ...sys({ type: types.TEAM_SPACE_MEMBERSHIP }),
      team,
      space,
    },
  };
}

export function Invitation(organizationMembership = Link(types.ORGANIZATION_MEMBERSHIP)) {
  return {
    sys: {
      ...sys({ type: 'Invitation' }),
      organizationMembership,
    },
  };
}

export function Plan(options) {
  return { sys: sys({ id: uniqueId('Plan'), type: 'ProductRatePlan' }), ...options };
}

export function SpaceRole(name = '') {
  return {
    name: name,
    description: 'description',
    permissions: {},
    policies: [],
    sys: sys(),
  };
}

function BaseResource(type, usage, limit, id) {
  return {
    usage,
    limits: {
      maximum: limit,
      included: limit,
    },
    sys: {
      type,
      id,
    },
  };
}

export function SpaceResource(usage, limit, id) {
  return BaseResource('SpaceResource', usage, limit, id);
}

export function OrganizationResource(usage, limit, id) {
  return BaseResource('OrganizationResource', usage, limit, id);
}
