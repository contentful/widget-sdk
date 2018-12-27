import { can } from 'access_control/AccessChecker/index.es6';

export default {
  name: 'usage',
  url: '/usage',
  template: '<react-component name="app/SpaceSettings/Usage/SpaceUsage.es6" props="props" />',
  controller: [
    '$state',
    '$scope',
    'require',
    ($state, $scope, require) => {
      const spaceContext = require('spaceContext');

      const hasAccess = can('update', 'settings');
      if (!hasAccess) {
        $state.go('spaces.detail');
      } else {
        $scope.props = {
          spaceId: spaceContext.getId(),
          orgId: spaceContext.organization.sys.id
        };
      }
    }
  ]
};
