'use strict';

/**
 * Enable time range boundary and select time.
 */
angular.module('contentful').directive('cfValidationDateSelect', () => {
  return {
    restrict: 'E',
    require: ['^cfValidate', '^form'],
    template: JST['cf_validation_date_select'](),
    scope: true,
    controllerAs: 'dateSelect',
    controller: [
      '$scope',
      '$attrs',
      '$parse',
      ($scope, $attrs, $parse) => {
        const dataGetter = $parse($attrs.data);
        const date = getDate();
        $scope.enabled = !!date;
        $scope.date = date;

        $scope.$watch('date', setDate);
        $scope.$watch('date', (date, prev) => {
          if (date !== prev) {
            $scope.$parent.$emit('ngModel:update', { value: date, ngModel: {} });
            $scope.$parent.$emit('ngModel:commit', { value: date, ngModel: {} });
          }
        });

        $scope.$on('ngModel:commit', stopPropagation);
        $scope.$on('ngModel:update', stopPropagation);

        $scope.$watch('enabled', enabled => {
          if (enabled) {
            setDate($scope.date);
          } else {
            setDate(null);
          }
        });

        function getDate() {
          return dataGetter($scope.$parent);
        }

        function setDate(value) {
          return dataGetter.assign($scope.$parent, value);
        }
      }
    ],
    link: function(scope, _elem, attrs, ctrls) {
      scope.label = attrs.ariaLabel;

      const validator = ctrls[0];
      const form = ctrls[1];
      scope.$watch('enabled', () => {
        if (form.$dirty) {
          validator.run();
        }
      });
    }
  };

  function stopPropagation(ev) {
    ev.stopPropagation();
  }
});
