export default {
  name: 'detail',
  params: {
    userId: ''
  },
  title: 'Organization users',
  url: '/:userId',
  resolve: {
    membership: [
      'data/EndpointFactory.es6',
      'access_control/OrganizationMembershipRepository.es6',
      '$stateParams',
      async (endpointFactory, repo, $stateParams) => {
        const endpoint = endpointFactory.createOrganizationEndpoint($stateParams.orgId);
        const membership = await repo.getMembership(endpoint, $stateParams.userId);
        const user = await repo.getUser(endpoint, membership.sys.user.sys.id);
        // TODO: fetch only the USER as soon as we have the membership as a link
        return { ...membership, sys: { ...membership.sys, user } };
      }
    ]
  },
  controller: [
    '$scope',
    '$stateParams',
    'membership',
    ($scope, $stateParams, membership) => {
      $scope.context.ready = true;
      $scope.properties = {
        membership,
        orgId: $stateParams.orgId
      };
    }
  ],
  template:
    '<react-component watch-depth="reference" name="app/OrganizationSettings/Users/UserDetail/UserDetail.es6" props="properties" />'
};
