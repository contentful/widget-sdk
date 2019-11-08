import { reactStateWrapper } from 'states/utils.es6';

export default reactStateWrapper({
  name: 'invitation',
  url: '/invitations/:invitationId',
  params: {
    invitationId: ''
  },
  componentPath:
    'app/OrganizationSettings/UserInvitations/UserInvitationDetail/UserInvitationDetailRouter.es6'
});
