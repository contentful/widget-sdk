export default {
  name: 'detail',
  params: {
    userId: ''
  },
  title: 'Organization users',
  url: '/:userId',
  resolve: {
    props: [
      'data/EndpointFactory.es6',
      'access_control/OrganizationMembershipRepository.es6',
      '$stateParams',
      async (endpointFactory, repo, $stateParams) => {
        const endpoint = endpointFactory.createOrganizationEndpoint($stateParams.orgId);
        const membership = await repo.getMembership(endpoint, $stateParams.userId);
        const [user, spaceMemberships] = await Promise.all([
          repo.getUser(endpoint, membership.sys.user.sys.id),
          repo.getSpaceMemberships(endpoint)
        ]);

        return {
          membership: { ...membership, sys: { ...membership.sys, user } },
          spaceMemberships: spaceMemberships.items
        };
      }
    ]
  },
  controller: [
    '$scope',
    '$stateParams',
    'props',
    ($scope, $stateParams, props) => {
      const { membership, spaceMemberships } = props;
      $scope.context.ready = true;
      $scope.properties = {
        membership,
        spaceMemberships,
        orgId: $stateParams.orgId
      };
    }
  ],
  template:
    '<react-component watch-depth="reference" name="app/OrganizationSettings/Users/UserDetail/UserDetail.es6" props="properties" />'
};
