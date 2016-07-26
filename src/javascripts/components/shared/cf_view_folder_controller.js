'use strict';

angular.module('contentful')
.controller('CfViewFolderController', ['$scope', 'modalDialog', 'analytics',
function ($scope, modalDialog, analytics) {

  $scope.$watch('folder.id', function (id) {
    $scope.regularFolder = id !== 'default';
  });

  $scope.deleteViewFromFolder = function (view, folder) {
    modalDialog.openConfirmDeleteDialog({
      title: 'Delete view',
      message: 'Do you really want to delete the view <span class="modal-dialog__highlight">' + view.title + '</span>?',
      scope: $scope
    }).promise.then(function () {
      _.remove(folder.views, {id: view.id});
      $scope.cleanDefaultFolder();
      analytics.trackTotango('Deleted View');
      return $scope.saveViews();
    });
  };

}]);
