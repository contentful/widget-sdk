'use strict';
angular.module('contentful').directive('viewMenu', function(){
  return {
    restrict: 'A',
    template: JST['view_menu'](),
    controller: function ($scope) {
      $scope.folderStates = {};

      $scope.toggleFolder = function (folder) {
        if ($scope.folderStates[folder.id] === 'closed') {
          $scope.folderStates[folder.id] = 'open';
        } else {
          $scope.folderStates[folder.id] = 'closed';
        }
      };

      $scope.isFolderOpen = function (folder) {
        return $scope.folderStates[folder.id] !== 'closed';
      };

      $scope.$watch('canEditUiConfig', function (can) {
        $scope.viewMenuEditable = can;
        $scope.viewSortOptions.disabled = !can;
        $scope.folderSortOptions.disabled = !can;
      });

      $scope.viewSortOptions = {
        connectWith: '[ui-sortable=viewSortOptions]',
        stop: function () {
          $scope.saveEntryListViews();
        }
      };

      $scope.folderSortOptions = {
        connectWith: '[ui-sortable=folderSortOptions]',
        handle: 'header',
        stop: function () {
          $scope.saveEntryListViews();
        }
      };
    }
  };
});
