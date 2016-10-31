'use strict';

angular.module('contentful')
.controller('CfViewFolderController', ['$scope', 'require', function ($scope, require) {

  var modalDialog = require('modalDialog');
  var analytics = require('analytics');
  var htmlEncode = require('encoder').htmlEncode;

  $scope.$watch('folder.id', function (id) {
    $scope.regularFolder = id !== 'default';
  });

  $scope.deleteViewFromFolder = function (view, folder) {
    modalDialog.openConfirmDeleteDialog({
      title: 'Delete view',
      message:
        'Do you really want to delete the view ' +
        '<span class="modal-dialog__highlight">' + htmlEncode(view.title) +
        '</span>?',
      scope: $scope
    }).promise.then(function () {
      _.remove(folder.views, {id: view.id});
      $scope.cleanDefaultFolder();
      analytics.track('Deleted View');
      return $scope.saveViews();
    });
  };

}]);
