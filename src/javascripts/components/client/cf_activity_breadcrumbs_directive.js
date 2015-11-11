'use strict';

angular.module('contentful').directive('cfActivityBreadcrumbs', ['$injector', function ($injector) {

  var contextHistory = $injector.get('contextHistory');
  var spaceContext   = $injector.get('spaceContext');

  return {
    template: JST.cf_activity_breadcrumbs(),
    restrict: 'AE',
    replace: true,
    controller: ['$scope', function ($scope) {
      $scope.activity = {};

      $scope.$watchCollection(function () {
        return contextHistory.getAll();
      }, function () {
        $scope.activity.context = contextHistory.getAllButLast();
        $scope.activity.empty = ($scope.activity.context.length < 1);
      });

      $scope.title = function (entity) {
        switch(entity.getType()) {
          case 'Entry': return spaceContext.entryTitle(entity);
          case 'Asset': return spaceContext.assetTitle(entity);
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
}]);
