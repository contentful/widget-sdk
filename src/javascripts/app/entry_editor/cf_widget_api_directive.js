'use strict';

/**
 * @ngdoc directive
 * @name cfWidgetApi
 *
 * @description
 * Provides an interface similar to the new widget api.
 *
 * @scope.requires {Object} otSubDoc
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

  $scope.$on('otValueChanged', createValueChangedSignalDispatcher());
  $scope.$on('otValueReverted', createValueChangedSignalDispatcher(true));

  $scope.$watch(function () {
    return $scope.isDisabled($scope.field, $scope.locale);
  }, function (value) {
    isDisabledSignal.dispatch(value);
  });

  this.settings = $scope.widget.settings;
  this.settings.helpText = this.settings.helpText || $scope.widget.defaultHelpText;

  this.field = {
    onValueChanged: valueChangedSignal.attach,
    onDisabledStatusChanged: isDisabledSignal.attach,
    getValue: getValue,
    setValue: createSetter('changeValue'),
    setString: createSetter('changeString'),
    removeValue: removeValue,
    id: ctField.apiName, // we only want to expose the public ID
    locale: $scope.locale.code,
    type: ctField.type,
    required: !!ctField.required,
    validations: ctField.validations,
    itemValidations: dotty.get(ctField, ['items', 'validations'])
  };

  function getValue () {
    return $scope.otSubDoc.getValue();
  }

  function createSetter(method) {
    return function setValue (value) {
      if (value === getValue()) {
        return $q.resolve(value);
      } else {
        return $scope.otSubDoc[method](value);
      }
    };
  }

  function removeValue() {
    return $scope.otSubDoc.removeValue();
  }

  function createValueChangedSignalDispatcher(shouldCheckPath) {
    return function dispatchValueChangedSignal (e, path, value) {
      if (!shouldCheckPath || isPathMatching(path)) {
        valueChangedSignal.dispatch(value);
      }
    };
  }

  function isPathMatching (path) {
    if (!_.isArray($scope.otPath) || !_.isArray(path)) {
      throw new Error('Path should be an array of strings.');
    }

    return _.isEqual($scope.otPath, path);
  }

}]);
