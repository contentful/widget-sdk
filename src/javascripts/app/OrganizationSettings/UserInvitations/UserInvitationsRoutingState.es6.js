import { BV_USER_INVITATIONS } from 'featureFlags.es6';

export default {
  name: 'users.invitations',
  url: '/:orgId/organization_invitations',
  featureFlag: BV_USER_INVITATIONS,
  reactComponentName: 'app/OrganizationSettings/UserInvitations/UserInvitationsListRouter.es6'
};
