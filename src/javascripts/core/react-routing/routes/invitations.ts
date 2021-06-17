/**
 * User invitations
 */

export type InvitationsRouteType = {
  path: 'invitations';
  invitationId: string;
  pathname?: string;
};

const invitationRoute = {
  invitations: (_, params: Omit<InvitationsRouteType, 'path'>) => {
    return {
      path: '/invitations',
      params: {
        pathname: `/${params.invitationId}`,
      },
    };
  },
};

export const routes = { ...invitationRoute };
