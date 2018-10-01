import ResolveLinks from '../../LinkResolver.es6';

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
        const includePaths = ['roles', 'sys.space'];
        const endpoint = endpointFactory.createOrganizationEndpoint($stateParams.orgId);
        const membership = await repo.getMembership(endpoint, $stateParams.userId);
        const [user, spaceMembershipsResult] = await Promise.all([
          repo.getUser(endpoint, membership.sys.user.sys.id),
          repo.getSpaceMemberships(endpoint, {
            include: includePaths.join(),
            'sys.user.sys.id': membership.sys.user.sys.id,
            limit: 100
          })
        ]);

        const { items, includes } = spaceMembershipsResult;
        const spaceMemberships = ResolveLinks({ paths: includePaths, items, includes });

        return {
          initialMembership: { ...membership, sys: { ...membership.sys, user } },
          spaceMemberships: spaceMemberships.filter(membership => {
            return membership.user.sys.id === user.sys.id;
          })
        };
      }
    ]
  },
  controller: [
    '$scope',
    '$stateParams',
    'props',
    ($scope, $stateParams, props) => {
      const { initialMembership, spaceMemberships } = props;
      $scope.context.ready = true;
      $scope.properties = {
        initialMembership,
        spaceMemberships,
        orgId: $stateParams.orgId
      };
    }
  ],
  template:
    '<react-component watch-depth="reference" name="app/OrganizationSettings/Users/UserDetail/UserDetail.es6" props="properties" />'
};
