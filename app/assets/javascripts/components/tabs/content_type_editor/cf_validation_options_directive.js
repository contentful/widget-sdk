'use strict';
angular.module('contentful').directive('cfValidationOptions', function (keycodes) {

  return {
    restrict: 'C',
    template: JST['cf_validation_options'](),

    link: function (scope) {

      scope.submitValue = function (ev) {
        ev.stopPropagation();
        var target = $(ev.target);
        if(ev.keyCode === keycodes.ENTER && target.val()){
          ev.preventDefault();
          scope.updateValues(target.val());
          target.val('');
        }
      };

      scope.removeFromValuesList = function (ev, index) {
        $(ev.target).parent().remove();
        scope.removeValue(index);
      };

    },

    controller: function CfValidationOptionsCtrl($scope, mimetype) {
      $scope.mimetypeGroups = mimetype.groupDisplayNames;

      $scope.updateValues = function (val) {
        $scope.validation.in = $scope.validation.in || [];
        if(!_.contains($scope.validation.in, val)){
          $scope.validation.in.push(val);
          $scope.updateDoc();
        }
      };

      $scope.removeValue = function (index) {
        $scope.validation.in.splice(index, 1);
        $scope.updateDoc();
      };

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
