'use strict';
angular.module('contentful').directive('cfViewFolder', function(random, $timeout, modalDialog){
  return {
    restrict: 'A',
    template: JST['cf_view_folder'](),
    controller: function ($scope) {
      $scope.$watch('folder.id', function (id) {
        $scope.regularFolder = id !== 'default';
      });

      $scope.addViewToFolder = function (folder) {
        var view = $scope.tab.params.view;
        view.id = random.id();
        folder.views.push(view);
        $scope.saveEntryListViews();

        $timeout(function () {
          $scope.$broadcast('startInlineEditor', view);
        });
      };
      
      $scope.deleteViewFromFolder = function (view, folder) {
        modalDialog.open({
          title: 'Delete View?',
          message: 'Do you really want to delete the View "'+view.title+'"?',
          confirmLabel: 'Delete View',
          scope: $scope
        }).then(function () {
          _.remove(folder.views, {id: view.id});
          return $scope.saveEntryListViews();
        });
      };

    }
  };
});
