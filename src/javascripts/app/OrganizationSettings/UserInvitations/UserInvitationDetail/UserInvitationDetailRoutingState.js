import { organizationRoute } from 'states/utils';
import UserInvitationDetailRouter from 'app/OrganizationSettings/UserInvitations/UserInvitationDetail/UserInvitationDetailRouter';

export default organizationRoute({
  name: 'invitation',
  url: '/invitations/:invitationId',
  params: {
    invitationId: ''
  },
  component: UserInvitationDetailRouter
});
