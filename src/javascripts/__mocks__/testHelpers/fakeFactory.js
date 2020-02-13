import { uniqueId } from 'lodash';

const USER = 'User';
const YEAR = '2020';
const DAY = '20';
const MONTH = '01';
const CREATED_AT_TIME_ISO = new Date(YEAR, MONTH, DAY).toISOString();
const CREATED_BY = Link(USER, uniqueId(USER));

export const CREATED_AT_TIME_DAY_MONTH_YEAR = `${YEAR}/${MONTH}/${DAY}`;

const types = {
  USER: USER,
  SPACE: 'Space',
  ORGANIZATION: 'Organization',
  ROLE: 'Role',
  TEAM: 'Team',
  SPACE_MEMBERSHIP: 'SpaceMembership',
  ORGANIZATION_MEMBERSHIP: 'OrganizationMembership',
  TEAM_MEMBERSHIP: 'TeamMembership'
};

export function sys(type = '', id, ...rest) {
  return {
    type,
    id: id || uniqueId(type.toLowerCase()),
    ...rest
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
    sys: sys(types.SPACE, uniqueSpaceId, CREATED_AT_TIME_ISO, CREATED_BY)
  };
}

export function Organization(name = '') {
  return {
    name: name || uniqueId('Organization'),
    sys: sys(types.ORGANIZATION)
  };
}

export function User(firstName = 'John', lastName = 'Doe') {
  return {
    firstName: firstName,
    lastName: lastName,
    email: `${firstName}@enterprise.com`,
    avatarUrl: 'avatar.jpg',
    sys: sys(types.USER)
  };
}

export function Team(name = '', description = '') {
  return {
    name,
    description,
    sys: sys(types.TEAM)
  };
}

export function Role(name = '', space = Link(types.SPACE)) {
  return {
    name,
    sys: {
      ...sys(types.ROLE),
      space
    }
  };
}

export function SpaceMembership(
  space = Link(types.SPACE),
  user = Link(types.USER),
  admin = true,
  roles = []
) {
  return {
    admin: admin,
    roles: roles,
    sys: {
      ...sys(types.SPACE_MEMBERSHIP),
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
      ...sys(types.ORGANIZATION_MEMBERSHIP),
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
      ...sys(types.TEAM_MEMBERSHIP),
      team,
      organizationMembership,
      user
    }
  };
}

// Please add to this as needed
export function BasePlan() {
  return { sys: sys('Plan') };
}
