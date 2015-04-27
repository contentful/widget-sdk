'use strict';

angular.module('contentful').
  directive('cfEntityInfoPanel', function() {
    return {
      restrict: 'A',
      controller: ['$scope', '$attrs', function EntityInfoPanelController($scope, $attrs) {
        $scope.$watch('entry && spaceContext.publishedTypeForEntry(entry).getName()', function(name, old, scope) {
          scope.contentTypeName = name;
        });

        $scope.$watch('entry && spaceContext.publishedTypeForEntry(entry).data.description', function(description, old, scope) {
          scope.contentTypeDescription = description;
        });

        $scope.$watch($attrs.cfEntityInfoPanel, function(sys) {
          $scope.sys = sys;
        });

        $scope.entityVersion = function () {
          if($scope.otDoc)
            return $scope.otDoc.version;
          if($scope.sys)
            return $scope.sys.version;
          return '';
        };

      }],
      template: JST['entity_info_panel']
    };
  });

