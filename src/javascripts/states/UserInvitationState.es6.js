import makeState from 'states/Base.es6';

export default makeState({
  name: 'invitations',
  url: '/invitations/:invitationToken',
  template:
    '<react-component name="components/shared/UserInvitation.es6" props="props"></react-component>',
  loadingText: 'Loading your invitation...',
  resolve: {
    invitationData: [
      '$stateParams',
      async $stateParams => {
        const { invitationToken } = $stateParams;

        let invitation;
        let error;

        try {
          invitation = await new Promise((resolve, reject) => {
            if (invitationToken === '1234') {
              return resolve({
                orgName: 'Pizza',
                orgRole: 'member',
                inviterName: 'John Adams',
                ssoEnabled: true
              });
            } else {
              return reject(new Error('Could not retrieve invitation'));
            }
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
