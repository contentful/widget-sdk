'use strict';
angular.module('contentful').directive('cfValidationOptions', ['keycodes', function (keycodes) {

  // If precision is larger than this number is only represented in exponential
  // because lol javascript
  var MAX_PRECISON = 21;

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

    },

    controller: ['$scope', 'mimetype', 'notification', function CfValidationOptionsController($scope, mimetype, notification) {
      $scope.mimetypeGroups = mimetype.getGroupNames();

      function fieldIsNumeric() {
        return $scope.field.type == 'Number' || $scope.field.type == 'Integer';
      }

      $scope.updateValues = function (initialValue) {
        // enforce strings because of length checking in conversion
        if(initialValue !== null && typeof initialValue != 'string') throw new Error('Value needs to be a string.');
        var value = initialValue;
        value = ($scope.field.type == 'Integer') ? parseInt(value, 10) : value;
        value = ($scope.field.type == 'Number') ? parseFloat(value, 10) : value;
        value = (fieldIsNumeric() && isNaN(value) || fieldIsNumeric() && initialValue.length > MAX_PRECISON) ? null : value;

        $scope.validation.in = $scope.validation.in || [];
        if(!value && initialValue && initialValue.length > MAX_PRECISON){
          notification.warn('Numbers should be 21 characters long or less (use a text field otherwise).');
        } else if(!value){
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

      $scope.removeIndex = function (index) {
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

    }]
  };
}]);
