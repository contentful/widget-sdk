import makeState from 'states/Base';
import { createEndpoint } from 'data/EndpointFactory';
import { go } from 'states/Navigator';
import { Notification } from '@contentful/forma-36-react-components';
import { getUser } from 'services/TokenStore';
import _ from 'lodash';

export default makeState({
  name: 'invitations',
  url: '/invitations/:invitationId',
  template:
    '<react-component name="components/shared/UserInvitation" props="props" watch-depth="reference"></react-component>',
  loadingText: 'Loading your invitation…',
  resolve: {
    invitationData: [
      '$stateParams',
      async $stateParams => {
        const { invitationId } = $stateParams;
        const endpoint = createEndpoint();

        let invitation;

        try {
          invitation = await endpoint({
            method: 'GET',
            path: ['invitations', invitationId]
          });
        } catch (error) {
          return {
            error
          };
        }

        // Redirect to home with success message if user already accepted the invitation
        if (invitation.status === 'accepted') {
          go({
            path: ['home']
          }).then(() => {
            Notification.success(`You’ve already accepted this invitation!`);
          });

          return;
        }

        return { invitation };
      }
    ],
    user: [getUser]
  },
  controller: [
    'invitationData',
    'user',
    '$scope',
    (invitationData, user, $scope) => {
      $scope.context.ready = true;
      $scope.props = {};

      const { invitation, error } = invitationData;

      $scope.props.user = user;

      if (error) {
        $scope.props.errored = true;
      } else {
        $scope.props.invitation = invitation;
      }
    }
  ]
});
