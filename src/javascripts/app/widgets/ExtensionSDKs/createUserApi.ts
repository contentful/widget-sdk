import { User } from '@contentful/app-sdk';

export interface SpaceMember {
  admin: boolean;
  roles: { name: string; description: string | null }[];
  sys: {
    id: string;
    user: {
      sys: {
        id: string;
      };
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl: string;
    };
  };
}

export const createUserApi = (spaceMember: SpaceMember): User => {
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
