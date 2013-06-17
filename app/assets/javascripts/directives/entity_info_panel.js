'use strict';

angular.module('contentful').
  directive('entityInfoPanel', function() {
    return {
      restrict: 'C',
      controller: function EntityInfoPanelCtrl($scope) {
        $scope.$watch('entry && spaceContext.publishedTypeForEntry(entry).getName()', function(name, old, scope) {
          scope.contentTypeName = name;
        });

        $scope.$watch('entry && spaceContext.publishedTypeForEntry(entry).data.description', function(description, old, scope) {
          scope.contentTypeDescription = description;
        });

        $scope.$watch('otDoc.snapshot.sys', function(sys) {
          $scope.sys = sys;
        });
      },
      template: JST['entity_info_panel']
    };
  });

