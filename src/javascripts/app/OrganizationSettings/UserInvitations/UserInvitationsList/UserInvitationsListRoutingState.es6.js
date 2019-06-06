import { reactStateWrapper } from 'app/routeUtils.es6';

export default reactStateWrapper({
  name: 'invitations',
  url: '/:orgId/invitations',
  componentPath:
    'app/OrganizationSettings/UserInvitations/UserInvitationsList/UserInvitationsListRouter.es6'
});
