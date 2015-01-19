'use strict';

angular.module('contentful').directive('cfSlugEditor', [function () {
  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_slug_editor'](),
    controller: 'SlugEditorController',
    controllerAs: 'slugEditorController'
  };
}]);

