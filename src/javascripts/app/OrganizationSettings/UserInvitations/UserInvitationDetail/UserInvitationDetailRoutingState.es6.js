import { BV_USER_INVITATIONS } from 'featureFlags.es6';
import { reactStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

export default reactStateWrapper({
  name: 'invitation',
  url: '/:orgId/invitations/:invitationId',
  params: {
    invitationId: ''
  },
  featureFlag: BV_USER_INVITATIONS,
  componentPath:
    'app/OrganizationSettings/UserInvitations/UserInvitationDetail/UserInvitationDetailRouter.es6'
});
