import { reactStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

export default reactStateWrapper({
  name: 'invitations',
  url: '/:orgId/invitations',
  componentPath:
    'app/OrganizationSettings/UserInvitations/UserInvitationsList/UserInvitationsListRouter.es6'
});
