'use strict';

angular.module('contentful').directive('cfAppContainer', ['require', function (require) {
  return {
    template: require('components/app_container/AppContainer').default(),
    restrict: 'E',
    // FIXME move this further down maybe
    controller: 'SpaceController'
  };
}]);
