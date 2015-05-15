'use strict';

angular.module('contentful').directive('cfActivityBreadcrumbs', function () {
  return {
    template: JST.cf_activity_breadcrumbs(),
    restrict: 'AE',
    replace: true,
    controllerAs: 'activity',
    controller: ['$scope', function ($scope) {
      var controller = this;

      $scope.$watchCollection('contextHistory', function (context) {
        controller.context = context.slice(0, context.length - 1);
        controller.empty = (controller.context.length < 1);
      });

      $scope.title = function (entity) {
        switch(entity.getType()) {
          case 'Entry': return $scope.spaceContext.entryTitle(entity);
          case 'Asset': return $scope.spaceContext.assetTitle(entity);
          default     : return '';
        }
      };
      $scope.sref = function (entity) {
        switch(entity.getType()) {
          case 'Entry': return 'spaces.detail.entries.detail({ entryId: "' + entity.getId() + '", addToContext: true })';
          case 'Asset': return 'spaces.detail.assets.detail({ assetId: "' + entity.getId() + '", addToContext: true })';
          default     : return '';
        }
      };
    }]
  };
});
