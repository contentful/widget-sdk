import { reactStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';
import { BV_USER_INVITATIONS } from 'featureFlags.es6';

export default reactStateWrapper({
  name: 'invitations',
  url: '/:orgId/invitations',
  featureFlag: BV_USER_INVITATIONS,
  componentPath:
    'app/OrganizationSettings/UserInvitations/UserInvitationsList/UserInvitationsListRouter.es6'
});
