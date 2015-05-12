'use strict';

/**
 * Enable time range boundary and select time.
 */
angular.module('contentful')
.directive('cfValidationDateSelect', function() {
  return {
    restrict: 'E',
    template: JST['cf_validation_date_select'](),
    controller: ['$scope', '$attrs', '$parse', function($scope, $attrs, $parse) {
      var dataGetter = $parse($attrs.data);
      var date = getDate();
      $scope.enabled = !!date;
      $scope.date = date;

      $scope.$watch('date', setDate);

      $scope.$watch('enabled', function(enabled) {
        if (enabled)
          setDate(date);
        else
          setDate(null);
      });

      function getDate() {
        return dataGetter($scope.$parent);
      }

      function setDate(value) {
        return dataGetter.assign($scope.$parent, value);
      }
    }],
    scope: true,
    controllerAs: 'dateSelect',
    link: function(scope, elem, attrs) {
      scope.label = attrs.ariaLabel;

      scope.$watch('enabled', function(enabled) {
        elem.find('[cf-datetime-editor] input').attr('disabled', !enabled);
      });
    }
  };
});
