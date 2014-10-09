'use strict';

angular.module('contentful').controller('FieldActionsController', ['$scope', '$injector', function($scope, $injector) {
  var logger = $injector.get('logger');

  var openFieldID;
  $scope.toggleField = function (field) {
    if(!field) {
      logger.logError('field is not defined', {
        data: {
          fields: $scope.contentType.data.fields
        }
      });
    }
    if (openFieldID == field.id){
      openFieldID = null;
    } else {
      openFieldID = field.id;
    }
  };

  $scope.fieldClicked = function (field) {
    if (!$scope.isFieldOpen(field)) $scope.openField(field);
  };

  $scope.openField = function (field) {
    openFieldID = field.id;
  };

  $scope.closeAllFields = function () {
    openFieldID = null;
  };

  $scope.isFieldOpen = function (field) {
    return openFieldID == field.id;
  };

}]);
