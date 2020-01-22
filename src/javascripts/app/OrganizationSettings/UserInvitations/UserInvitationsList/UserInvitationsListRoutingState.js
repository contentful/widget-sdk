import { reactStateWrapper } from 'states/utils';
import UserInvitationsListRouter from 'app/OrganizationSettings/UserInvitations/UserInvitationsList/UserInvitationsListRouter';

export default reactStateWrapper({
  name: 'invitations',
  url: '/invitations',
  component: UserInvitationsListRouter
});
