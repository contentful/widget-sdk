import { reactStateWrapper } from 'states/utils';
import UserInvitationDetailRouter from 'app/OrganizationSettings/UserInvitations/UserInvitationDetail/UserInvitationDetailRouter';

export default reactStateWrapper({
  name: 'invitation',
  url: '/invitations/:invitationId',
  params: {
    invitationId: ''
  },
  component: UserInvitationDetailRouter
});
