'use strict';
angular.module('contentful').directive('cfValidationOptions', function (keycodes) {

  return {
    restrict: 'C',
    template: JST['cf_validation_options'](),

    link: function (scope, elem) {

      scope.submitValue = function (ev) {
        if(ev.keyCode === keycodes.ENTER){
          scope.updateValues(elem.val());
        }
      };

    },

    controller: function CfValidationOptionsCtrl($scope, mimetype) {
      $scope.mimetypeGroups = mimetype.groupDisplayNames;

      $scope.updateDoc = function () {
        if (!angular.isDefined($scope.validationIndex)) return;
        $scope.getValidationDoc($scope.validationIndex).set($scope.validation, function () {
          $scope.$apply($scope.updateValidationsFromDoc);
        });
      };

      $scope.changeType = function (newValidation) {
        var oldType = $scope.validationType($scope.validation);
        var newType = $scope.validationType(newValidation);
        delete $scope.validation[oldType];
        $scope.validation[newType] = newValidation[newType];
        $scope.updateDoc();
      };

    }
  };
});
