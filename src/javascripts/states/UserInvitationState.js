import makeState from 'states/Base';
import { createEndpoint } from 'data/EndpointFactory';
import { go } from 'states/Navigator';
import { Notification } from '@contentful/forma-36-react-components';
import { getUser, getOrganization } from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { get } from 'lodash';
import _ from 'lodash';
import UserInvitation from 'components/shared/UserInvitation';

export default makeState({
  name: 'invitations',
  url: '/invitations/:invitationId',
  template:
    '<react-component component="component" props="props" watch-depth="reference"></react-component>',
  loadingText: 'Loading your invitation…',
  resolve: {
    invitationData: [
      '$stateParams',
      async ($stateParams) => {
        const { invitationId } = $stateParams;
        const endpoint = createEndpoint();

        let invitation;

        try {
          invitation = await endpoint({
            method: 'GET',
            path: ['invitations', invitationId],
          });
        } catch (error) {
          return {
            error,
          };
        }

        // Redirect to home with success message if user already accepted the invitation
        if (invitation.status === 'accepted') {
          const orgId = get(invitation, 'sys.organization.sys.id');
          const org = await getOrganization(orgId);
          const orgOwnerOrAdmin = isOwnerOrAdmin(org);
          go({
            path: ['home'],
            params: { orgId: orgId, orgOwnerOrAdmin: orgOwnerOrAdmin },
          }).then(() => {
            Notification.success(`You’ve already accepted this invitation!`);
          });

          return;
        }

        return { invitation };
      },
    ],
    user: [getUser],
  },
  controller: [
    'invitationData',
    'user',
    '$scope',
    (invitationData, user, $scope) => {
      $scope.context.ready = true;
      $scope.component = UserInvitation;
      $scope.props = {};

      const { invitation, error } = invitationData;

      $scope.props.user = user;

      if (error) {
        $scope.props.errored = true;
      } else {
        $scope.props.invitation = invitation;
      }
    },
  ],
});
