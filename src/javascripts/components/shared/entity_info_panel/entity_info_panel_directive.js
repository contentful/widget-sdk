'use strict';

angular.module('contentful')
.directive('cfEntityInfoPanel', ['require', function (require) {
  var K = require('utils/kefir');

  return {
    scope: {
      // Property<API.Sys>
      entitySysProperty: '<',
      // API.ConentType
      contentType: '<?',
      // API.User
      user: '<'
    },
    restrict: 'E',
    template: JST.entity_info_panel(),
    controller: ['$scope', function ($scope) {
      if ($scope.contentType) {
        $scope.contentTypeName = $scope.contentType.name || 'Untitled';
        $scope.contentTypeDescription = $scope.contentType.description;
      }

      K.onValueScope($scope, $scope.entitySysProperty, function (sys) {
        $scope.sys = sys;
      });
    }]
  };
}]);
