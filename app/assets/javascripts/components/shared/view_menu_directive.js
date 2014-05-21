'use strict';
angular.module('contentful').directive('viewMenu', function(){
  return {
    restrict: 'A',
    template: JST['view_menu'](),
    link: function(scope, elem, attr){
      
    },
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
    }
  };
});
