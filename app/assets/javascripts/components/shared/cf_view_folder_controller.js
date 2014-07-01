'use strict';
angular.module('contentful').controller('CfViewFolderController', ['$scope', 'modalDialog', 'analytics', function ($scope, modalDialog, analytics) {
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
      $scope.cleanDefaultFolder();
      analytics.trackTotango('Deleted View');
      return $scope.saveViews();
    });
  };

}]);
