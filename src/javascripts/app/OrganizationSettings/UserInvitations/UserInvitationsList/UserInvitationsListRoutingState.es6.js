import { reactStateWrapper } from 'states/utils.es6';

export default reactStateWrapper({
  name: 'invitations',
  url: '/:orgId/invitations',
  componentPath:
    'app/OrganizationSettings/UserInvitations/UserInvitationsList/UserInvitationsListRouter.es6'
});
