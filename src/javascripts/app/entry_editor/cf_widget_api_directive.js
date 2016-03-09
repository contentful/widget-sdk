'use strict';

/**
 * @ngdoc directive
 * @name cfWidgetApi
 *
 * @description
 * Provides an interface similar to the new widget api.
 *
 * @scope.requires {Object} otSubDoc
 * @scope.requires (Object) otDoc
 * @scope.requires {Object} widget
 * @scope.requires {Function} isDisabled
 */
angular.module('contentful')
.directive('cfWidgetApi', [function () {
  return {
    restrict: 'A',
    controller: 'WidgetApiController'
  };
}])
.controller('WidgetApiController', ['$scope', '$injector', function ($scope, $injector) {
  var $q = $injector.get('$q');
  var newSignal = $injector.get('signal');
  var valueChangedSignal = newSignal($scope.otSubDoc.getValue());
  var isDisabledSignal = newSignal($scope.isDisabled($scope.field, $scope.locale));
  var ctField = $scope.widget.field;

  $scope.$on('otValueChanged', function (e, path, value) {
    valueChangedSignal.dispatch(value);
  });

  $scope.$watch(function () {
    return $scope.isDisabled($scope.field, $scope.locale);
  }, function (value) {
    isDisabledSignal.dispatch(value);
  });

  this.settings = $scope.widget.settings;

  this.field = {
    onValueChanged: valueChangedSignal.attach,
    setValue: function (value) {
      if (value === $scope.otSubDoc.getValue()) {
        return $q.resolve(value);
      } else {
        return $scope.otSubDoc.changeValue(value);
      }
    },
    setString: function (value) {
      return $scope.otSubDoc.changeString(value);
    },
    getValue: function () {
      return $scope.otSubDoc.getValue();
    },
    onDisabledStatusChanged: isDisabledSignal.attach,

    // we only want to expose the public ID
    id: ctField.apiName,
    locale: $scope.locale.code,
    type: ctField.type,
    required: !!ctField.required,
    validations: ctField.validations
  };
}])
.factory('WidgetApiController/caretPosition', [function () {
  return {
    getPreservedCaretPosition: function (currentCaretPosition, currentValue, newValue) {
      if (currentValue === newValue) {
        return currentCaretPosition;
      }

      // sharejs sets newValue to `null` when it's "empty"
      // This makes sure newValue.length doesn't blow up
      newValue = newValue || '';

      // preserve caret position for more natural editing
      var commonStart = 0;
      var caretPosition = currentCaretPosition;
      var noOfCharsModified = newValue.length - currentValue.length;

      if (!newValue) {
        caretPosition = 0;
      }
      else {
        while(currentValue.charAt(commonStart) === newValue.charAt(commonStart)) {
          commonStart++;
        }
        if (commonStart <= caretPosition) {
          caretPosition += noOfCharsModified;
        }
      }

      return caretPosition;
    }
  };
}]);
