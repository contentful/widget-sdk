'use strict';

angular.module('contentful/directives').
  directive('entityInfoPanel', function() {
    return {
      restrict: 'C',
      controller: function EntityInfoPanelCtrl($scope) {
        $scope.$watch('entry && bucketContext.publishedTypeForEntry(entry).data.name', function(name, old, scope) {
          scope.entryTypeName = name;
        });

        $scope.$watch('otDoc.snapshot.sys', function(sys) {
          $scope.sys = sys;
        });
      },
      template: JST['entity_info_panel']
    };
  });

