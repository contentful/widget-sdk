import base from 'states/Base';
import homeTemplateDef from 'app/home/HomeTemplate';
import { spaceResolver } from 'states/Resolvers';

export default base({
  name: 'home',
  url: '/home',
  resolve: {
    space: spaceResolver
  },
  template: homeTemplateDef(),
  loadingText: 'Loading…',
  controller: [
    '$scope',
    $scope => {
      $scope.context.ready = true;
      // This listener is triggered on completion of The Example Space creation
      $scope.$on('spaceTemplateCreated', () => {
        // the 'spaceTemplateCreated' is passed as prop to SpaceHomePage
        // this triggers re-fetch of data and updates space home view
        $scope.spaceTemplateCreated = true;
      });
    }
  ]
});
