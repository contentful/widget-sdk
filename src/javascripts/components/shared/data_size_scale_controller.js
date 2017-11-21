'use strict';

/**
 * Manipulate a raw value by setting the unit and a scaled value.
 *
 * The controller exposes to properties on its scope. The `unitFactor`
 * and the `value` numbers. This numbers are multiplied and written to
 * a parent scope property. The name of the parent scope property is
 * given by the `data-model` attribute.
 *
 * The controller has a `units` object whose keys are labels for the
 * units and whose values are the unit factors.
 */
angular.module('contentful')
.controller('DataSizeScaleController',
['$scope', '$attrs', 'require', function($scope, $attrs, require) {
  var $parse = require('$parse');
  var controller = this;

  var getModelValue = _.partial($parse($attrs.model), $scope.$parent);
  var setModelValue = _.partial($parse($attrs.model).assign, $scope.$parent);

  var units = controller.units = [
    {label: 'Bytes', factor: 1},
    {label: 'KB',    factor: 1024},
    {label: 'MB',    factor: 1024 * 1024},
  ];

  var unitFactors = _.map(units, 'factor');

  $scope.unitFactor = getUnitFactor(getModelValue());

  $scope.$watch($attrs.model, updateScaledValue);
  $scope.$watch('unitFactor', updateModelValue);
  $scope.$watch('value', updateModelValue);

  $scope.$on('ngModel:commit', updateModelValue);


  function updateModelValue() {
    var raw = _.isFinite($scope.value) ? $scope.value * $scope.unitFactor : null;
    setModelValue(raw);
  }

  function updateScaledValue(raw) {
    $scope.value = _.isFinite(raw) ? raw / $scope.unitFactor : null;
  }

  /**
   * Return the largest unit factor such that the scaled value is
   * larger than 1.
   */
  function getUnitFactor(baseValue) {
    var factor = _.findLast(unitFactors, function(factor) {
      return baseValue / factor >= 1;
    });
    return factor || unitFactors[0];
  }
}]);
