import makeState from 'states/Base.es6';
import { createEndpoint } from 'data/EndpointFactory.es6';
import { go } from 'states/Navigator.es6';
import { Notification } from '@contentful/ui-component-library';

export default makeState({
  name: 'invitations',
  url: '/invitations/:invitationId',
  template:
    '<react-component name="components/shared/UserInvitation.es6" props="props"></react-component>',
  loadingText: 'Loading your invitation...',
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
            Notification.success(`Youʼve already accepted this invitation!`);
          });

          return;
        }

        return { invitation };
      }
    ]
  },
  controller: [
    'invitationData',
    '$scope',
    (invitationData, $scope) => {
      $scope.context.ready = true;
      $scope.props = {};

      const { invitation, error } = invitationData;

      if (error) {
        // Right now the error is being handled in a generic way, so just tell the component that
        // an error happened.
        $scope.props.errored = true;
      } else {
        $scope.props.invitation = invitation;
      }
    }
  ]
});
