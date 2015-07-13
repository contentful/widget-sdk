'use strict';

/**
 * Enable time range boundary and select time.
 */
angular.module('contentful')
.directive('cfValidationDateSelect', function() {
  return {
    restrict: 'E',
    require: ['^cfValidate', '^form'],
    template: JST['cf_validation_date_select'](),
    scope: true,
    controllerAs: 'dateSelect',
    controller: ['$scope', '$attrs', '$parse', function($scope, $attrs, $parse) {
      var dataGetter = $parse($attrs.data);
      var date = getDate();
      $scope.enabled = !!date;
      $scope.date = date;

      $scope.$watch('date', setDate);
      $scope.$watch('date', function (date, prev) {
        if (date !== prev) {
          $scope.$parent.$emit('ngModel:update', {value: date, ngModel: {}});
          $scope.$parent.$emit('ngModel:commit', {value: date, ngModel: {}});
        }
      });


      $scope.$on('ngModel:commit', stopPropagation);
      $scope.$on('ngModel:update', stopPropagation);

      $scope.$watch('enabled', function(enabled) {
        if (enabled)
          setDate($scope.date);
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
    link: function(scope, elem, attrs, ctrls) {
      scope.label = attrs.ariaLabel;

      var validator = ctrls[0];
      var form = ctrls[1];
      scope.$watch('enabled', function(enabled) {
        if (form.$dirty) {
          validator.run();
        }
        elem.find('[cf-datetime-editor] input').attr('disabled', !enabled);
      });
    }
  };

  function stopPropagation (ev) {
    ev.stopPropagation();
  }
});
