import { uniqueId } from 'lodash';

export function sys(type = '', id) {
  return {
    type,
    id: id || uniqueId(type.toLowerCase())
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
  return {
    name: name || uniqueId('Space'),
    sys: sys('Space')
  };
}

export function Organization(name = '') {
  return {
    name: name || uniqueId('Organization'),
    sys: sys('Organization')
  };
}

export function User(firstName = '', lastName = 'Doe') {
  const name = firstName || uniqueId('User');
  return {
    firstName: name,
    lastName: lastName,
    email: `${firstName}@enterprise.com`,
    avatarUrl: 'avatar.jpg',
    sys: sys('User')
  };
}

export function Team(name = '', description = '') {
  return {
    name,
    description,
    sys: sys('Team')
  };
}

export function SpaceMembership(space, user, admin, roles) {
  return {
    admin: admin || true,
    roles: roles || [],
    sys: {
      ...sys('SpaceMembership'),
      user: user || Link('User'),
      space: space || Link('Space'),
      createdBy: Link('User')
    }
  };
}

export function OrganizationMembership(role = 'member', status = 'active', user) {
  return {
    role,
    status,
    sys: {
      ...sys('OrganizationMemberahip'),
      user: user || Link('User'),
      createdBy: Link('User')
    }
  };
}

export function TeamMembership(team, organizationMembership, user) {
  return {
    sys: {
      ...sys('TeamMembership'),
      team: team || Link('Link'),
      organizationMembership: organizationMembership || Link('OrganizationMembership'),
      user: user || Link('User')
    }
  };
}
