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
          if(scope.updateValues(target.val()))
            target.val('');
        }
      };

      scope.removeFromValuesList = function (ev, index) {
        $(ev.target).parent().remove();
        scope.removeValue(index);
      };

    },

    controller: function CfValidationOptionsCtrl($scope, mimetype, notification) {
      $scope.mimetypeGroups = mimetype.groupDisplayNames;

      $scope.updateValues = function (value) {
        value = ($scope.field.type == 'Integer') ? parseInt(value, 10) : value;
        value = ($scope.field.type == 'Number') ? parseFloat(value, 10) : value;
        value = (($scope.field.type == 'Number' || $scope.field.type == 'Integer') && isNaN(value)) ? null : value;

        $scope.validation.in = $scope.validation.in || [];
        if(!value){
          notification.warn('This value is invalid for this field type');
        } else if($scope.validation.in.length == 50){
          notification.warn('You can only add up to 50 predefined values');
        } else if(value.length > 85){
          notification.warn('Values should be 85 characters or less');
        } else if(_.contains($scope.validation.in, value)){
          notification.warn('This value already exists on the list');
        } else {
          $scope.validation.in.push(value);
          $scope.updateDoc();
          return true;
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
