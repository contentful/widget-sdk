import { organizationRoute } from 'states/utils';
import UserInvitationsListRouter from 'app/OrganizationSettings/UserInvitations/UserInvitationsList/UserInvitationsListRouter';

export default organizationRoute({
  name: 'invitations',
  url: '/invitations',
  component: UserInvitationsListRouter
});
