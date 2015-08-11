'use strict';

angular.module('contentful')

.controller('SpaceTemplatesPostController', ['$injector', '$scope', function SpaceController($injector, $scope) {

  var TheStore = $injector.get('TheStore');

  $scope.dismissInfoDialogForever = function () {
    $scope.dialog.confirm();
    TheStore.set('seenSpaceTemplateInfoDialog', true);
  };
}]);
