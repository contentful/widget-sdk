'use strict';

angular.module('contentful').controller('SpaceTemplatesPostController', ['$injector', '$scope', function SpaceController($injector, $scope) {

  $scope.dismissInfoDialogForever = function () {
    $scope.dialog.confirm();
    $.cookies.set('seenSpaceTemplateInfoDialog', true, {
      expiresAt: moment().add(1, 'y').toDate()
    });
  };

}]);
