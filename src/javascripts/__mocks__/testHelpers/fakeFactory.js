import { uniqueId } from 'lodash';

const DEFAULT_CREATED_AT_TIME_ISO = new Date('2020', '01', '20').toISOString();
export const CREATED_AT_TIME_DAY_MONTH_YEAR = '2020/01/20';

const types = {
  USER: 'User',
  SPACE: 'Space',
  ORGANIZATION: 'Organization',
  ROLE: 'Role',
  TEAM: 'Team',
  SPACE_MEMBERSHIP: 'SpaceMembership',
  ORGANIZATION_MEMBERSHIP: 'OrganizationMembership',
  TEAM_MEMBERSHIP: 'TeamMembership'
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
    ...options
  };
}

export function Link(linkType = '', id) {
  return {
    sys: {
      id: id || uniqueId(linkType.toLowerCase()),
      type: 'Link',
      linkType
    }
  };
}

export function Space(name = '') {
  const uniqueSpaceId = uniqueId('SpaceId');

  return {
    name: name || uniqueSpaceId,
    sys: sys({
      type: types.SPACE,
      id: uniqueSpaceId,
      createdAt: DEFAULT_CREATED_AT_TIME_ISO,
      createdBy: User()
    })
  };
}

export function Organization(options = {}) {
  return {
    name: uniqueId('Organization'),
    sys: sys({
      type: types.ORGANIZATION,
      id: uniqueId('OrganizationSys'),
      createdAt: DEFAULT_CREATED_AT_TIME_ISO
    }),
    ...options
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
    ...options
  };
}

export function Team(name = '', description = '') {
  return {
    name,
    description,
    sys: sys({ type: types.TEAM })
  };
}

export function Role(name = '', space = Link(types.SPACE)) {
  return {
    name,
    sys: {
      ...sys({ type: types.ROLE }),
      space
    }
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
      createdBy: Link(types.USER)
    }
  };
}

export function OrganizationMembership(
  role = 'member',
  status = 'active',
  user = Link(types.USER)
) {
  return {
    role,
    status,
    sys: {
      ...sys({ type: types.ORGANIZATION_MEMBERSHIP }),
      user: user,
      createdBy: Link(types.USER)
    }
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
      user
    }
  };
}

// Please add to this as needed
export function BasePlan() {
  return { sys: sys({ id: 'Plan' }) };
}

export function SpaceRole(name = '') {
  return {
    name: name,
    description: 'description',
    permissions: {},
    policies: [],
    sys: sys()
  };
}
