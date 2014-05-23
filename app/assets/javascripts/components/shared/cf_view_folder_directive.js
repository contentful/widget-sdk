'use strict';
angular.module('contentful').directive('cfViewFolder', function(random, $timeout, modalDialog){
  return {
    restrict: 'A',
    template: JST['cf_view_folder'](),
    controller: function ($scope) {
      $scope.$watch('folder.id', function (id) {
        $scope.regularFolder = id !== 'default';
      });

      $scope.deleteViewFromFolder = function (view, folder) {
        modalDialog.open({
          title: 'Delete View?',
          message: 'Do you really want to delete the View "'+view.title+'"?',
          confirmLabel: 'Delete View',
          scope: $scope
        }).then(function () {
          _.remove(folder.views, {id: view.id});
          if (folder.id === 'default' && _.isEmpty(folder.views)) {
            _.remove($scope.folders, {id: 'default'});
          }
          return $scope.saveEntryListViews();
        });
      };

    }
  };
});
