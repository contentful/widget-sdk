'use strict';

/**
 * Shows a list of fixed values of the `in` validation and an input
 * field to add values.
 */
angular.module('contentful')
.directive('cfValidationValues', ['$injector', function($injector) {
  var keycodes = $injector.get('keycodes');

  // If precision is larger than this number is only represented in exponential
  // because lol javascript
  var MAX_PRECISON = 21;

  return {
    restrict: 'E',
    template: JST['cf_validation_values'](),
    link: setupScrollIndicators,

    controller: ['$scope', function($scope) {

      /**
       * Sync 'validation.settings' and the local 'valueList'
       */
      $scope.$watch('validation.settings', function(valueList) {
        if (!valueList)
          $scope.validation.settings = valueList = [];
        $scope.valueList = valueList;
      });

      /**
       * Remove a the predefined value at the given position
       */
      $scope.remove = function(index) {
        $scope.valueList.splice(index, 1);
      };


      /**
       * Handles an 'Enter' keypress in order to add the current value
       * to the list.
       */
      $scope.onInputKey = function(ev) {
        ev.stopPropagation();
        var input = $(ev.target);
        if (ev.keyCode === keycodes.ENTER && input.val()) {
          delete $scope.validation.errors;
          ev.preventDefault();
          if (addValue(input.val()))
            input.val('');
        }
      };


      /**
       * Options for `ui-sortable`.
       */
      $scope.sortOptions = { axis: 'y' };


      /**
       * Take a string and parse it into a number if the field type is
       * 'Integer' or 'Number'. Otherwise return the string as-is.
       *
       * The function throws errors if the value could not be parsed
       * correctly.
       */
      function parseValue(value, type) {
        if (type == 'Number' || type == 'Integer') {
          if (value.length > MAX_PRECISON)
            throw new Error('Numbers should be 21 characters long or less (use a text field otherwise).');

          if (type == 'Integer')
            value = parseInt(value, 10);
          if (type == 'Number')
            value = parseFloat(value, 10);

          if (isNaN(value))
            throw new Error('You can only add number values.');

          return value;
        } else if (value.length > 85){
          throw new Error('Values must be 85 characters or less');
        } else {
          return value;
        }
      }

      function addValue(value) {
        try {
          value = parseValue(value, $scope.field.type);
        } catch (e) {
          setError(e.message);
          return;
        }

        if ($scope.valueList.length == 50){
          setError('You can only add up to 50 predefined values');
        } else if (_.contains($scope.valueList, value)){
          setError('This value already exists on the list');
        } else {
          $scope.valueList.push(value);
          return true;
        }
      }

      function setError(error) {
        $scope.validation.errors = [error];
      }
    }]
  };


  /**
   * Toggle indicators for scrolled value list.
   */
  function setupScrollIndicators(scope, elem) {
    var valueListFrame = elem.find('.validation-value-list__scroll-frame');
    var valueList      = valueListFrame.children('ul');
    var upIndicator    = elem.find('.validation-value-list .fa-caret-up');
    var downIndicator  = elem.find('.validation-value-list .fa-caret-down');

    function updateIndicators() {
      var listHeight = valueList.height();
      var frameHeight = valueListFrame.height();
      var scrollTop = valueListFrame.scrollTop();
      var scrollBottom = scrollTop + frameHeight;

      if (scrollTop > 0)
        upIndicator.show();
      else
        upIndicator.hide();

      if (listHeight > frameHeight && scrollBottom < listHeight)
        downIndicator.show();
      else
        downIndicator.hide();
    }

    valueListFrame.on('scroll', updateIndicators);
    scope.$watchCollection('valueList', updateIndicators);
  }
}]);
