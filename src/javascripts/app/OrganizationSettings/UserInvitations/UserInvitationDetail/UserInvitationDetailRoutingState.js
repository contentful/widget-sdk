import { reactStateWrapper } from 'states/utils';

export default reactStateWrapper({
  name: 'invitation',
  url: '/invitations/:invitationId',
  params: {
    invitationId: ''
  },
  componentPath:
    'app/OrganizationSettings/UserInvitations/UserInvitationDetail/UserInvitationDetailRouter'
});
