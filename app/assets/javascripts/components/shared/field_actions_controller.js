'use strict';

angular.module('contentful').controller('FieldActionsController', ['$scope', '$injector', function($scope, $injector) {
  var sentry = $injector.get('sentry');

  var openFieldUIID;
  $scope.toggleField = function (field) {
    if(!field) {
      sentry.captureError('field is not defined', {
        data: {
          fields: $scope.contentType.data.fields
        }
      });
    }
    if (openFieldUIID == field.uiid){
      openFieldUIID = null;
    } else {
      openFieldUIID = field.uiid;
    }
  };

  $scope.fieldClicked = function (field) {
    if (!$scope.isFieldOpen(field)) $scope.openField(field);
  };

  $scope.openField = function (field) {
    openFieldUIID = field.uiid;
  };

  $scope.closeAllFields = function () {
    openFieldUIID = null;
  };

  $scope.isFieldOpen = function (field) {
    return openFieldUIID == field.uiid;
  };

}]);
