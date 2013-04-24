'use strict';

angular.module('contentful/directives').
  directive('entityInfoPanel', function() {
    return {
      restrict: 'C',
      controller: function EntityInfoPanelCtrl($scope) {
        $scope.$watch('entry', function(entry) {
          if (!entry) return;
          $scope.entryTypeName = $scope.bucketContext.publishedTypeForEntry(entry).data.name;
        });

        $scope.$watch('doc.snapshot.sys', function(sys) {
          $scope.sys = sys;
        });
      },
      template: JST['entity_info_panel']
    };
  });

