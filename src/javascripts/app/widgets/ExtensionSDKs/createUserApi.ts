import { UserAPI } from '@contentful/app-sdk';
import { SpaceMember } from 'classes/spaceContextTypes';

export const createUserApi = (spaceMember: SpaceMember): UserAPI => {
  return {
    sys: {
      type: 'User',
      id: spaceMember.sys.user.sys.id,
    },
    firstName: spaceMember.sys.user.firstName,
    lastName: spaceMember.sys.user.lastName,
    email: spaceMember.sys.user.email,
    avatarUrl: spaceMember.sys.user.avatarUrl,
    spaceMembership: {
      sys: {
        type: 'SpaceMembership',
        id: spaceMember.sys.id,
      },
      admin: !!spaceMember.admin,
      roles: spaceMember.roles.map((role) => ({
        name: role.name,
        description: role.description ?? '',
      })),
    },
  };
};
