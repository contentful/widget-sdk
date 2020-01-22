import { can } from 'access_control/AccessChecker';
import SpaceUsage from './SpaceUsage';

export default {
  name: 'usage',
  url: '/usage',
  template: '<react-component component="component" props="props" />',
  controller: [
    '$state',
    '$scope',
    'spaceContext',
    ($state, $scope, spaceContext) => {
      const hasAccess = can('update', 'settings');

      $scope.component = SpaceUsage;

      if (!hasAccess) {
        $state.go('spaces.detail');
      } else {
        $scope.props = {
          spaceId: spaceContext.getId(),
          orgId: spaceContext.organization.sys.id,
          environmentMeta: spaceContext.space.environmentMeta
        };
      }
    }
  ]
};
