'use strict';

angular.module('contentful').directive('cfEntityInfoPanel', [
  'require',
  require => {
    const K = require('utils/kefir');

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
      controller: [
        '$scope',
        $scope => {
          if ($scope.contentType) {
            $scope.contentTypeName = $scope.contentType.name || 'Untitled';
            $scope.contentTypeDescription = $scope.contentType.description;
            $scope.contentTypeId = $scope.contentType.sys.id;
          }

          K.onValueScope($scope, $scope.entitySysProperty, sys => {
            $scope.sys = sys;
          });
        }
      ]
    };
  }
]);
