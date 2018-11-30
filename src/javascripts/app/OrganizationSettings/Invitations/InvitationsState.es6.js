import { BV_USER_INVITATIONS } from 'featureFlags.es6';

export default {
  name: 'invitations',
  url: '/:orgId/organization_invitations',
  featureFlag: BV_USER_INVITATIONS,
  reactComponentName: 'app/OrganizationSettings/Invitations/InvitationList/InvitationListRoute.es6'
};
