import base from 'states/Base.es6';
import homeTemplateDef from 'app/home/HomeTemplate.es6';
import { spaceResolver } from 'states/Resolvers.es6';

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
