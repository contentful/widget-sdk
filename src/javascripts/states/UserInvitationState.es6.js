import makeState from 'states/Base.es6';
import { createEndpoint } from 'data/EndpointFactory.es6';

export default makeState({
  name: 'invitations',

  // This is temporary, this will change to `/invitations/:id`
  url: '/organizations/invitations/:invitationId',
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
        let error;

        try {
          invitation = await endpoint({
            method: 'GET',
            path: ['organizations', 'invitations', invitationId]
          });
        } catch (e) {
          error = e;
        }

        return { invitation, error };
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
        $scope.props.error = error.message;
      } else {
        $scope.props.invitation = invitation;
      }
    }
  ]
});
