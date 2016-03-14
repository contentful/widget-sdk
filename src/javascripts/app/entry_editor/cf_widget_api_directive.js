'use strict';

/**
 * @ngdoc directive
 * @name cfWidgetApi
 *
 * @description
 * Provides an interface similar to the new widget api.
 *
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
  var newSignal = $injector.get('signal');
  var valueChangedSignal = newSignal($scope.otSubDoc.getValue());
  var isDisabledSignal = newSignal($scope.isDisabled($scope.field, $scope.locale));

  $scope.$on('otValueChanged', function (e, path, value) {
    valueChangedSignal.dispatch(value);
  });

  $scope.$watch(function () {
    return $scope.isDisabled($scope.field, $scope.locale);
  }, function (value) {
    isDisabledSignal.dispatch(value);
  });

  this.field = {
    onValueChanged: valueChangedSignal.attach,
    setString: function (value) {
      var stringChangedPromise = $scope.otSubDoc.changeString(value);

      // TODO(mudit/thomas): Super inefficient
      // Fix this
      $scope.otDoc.updateEntityData();
      return stringChangedPromise;
    },
    getValue: function () {
      return $scope.otSubDoc.getValue();
    },
    onDisabledStatusChanged: isDisabledSignal.attach,
    validations: $scope.widget.field.validations,
    type: $scope.widget.field.type
  };
}]);
