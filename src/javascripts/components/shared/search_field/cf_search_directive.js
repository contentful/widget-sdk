'use strict';

angular.module('contentful').directive('cfSearch', ['require', function (require) {
  var keycodes = require('keycodes');
  var debounce = require('debounce');

  return {
    template: JST['cf_search'](),
    restrict: 'A',
    scope: {
      placeholder: '@',
      search: '=cfSearch',
      tooltip: '@',
      isSearching: '='
    },

    link: function (scope, element, attr) {
      var typeAhead = 'searchTypeAhead' in attr;
      var debouncedUpdate = debounce(update, 300);

      element.on('keyup', function (ev) {
        var pressedReturn = ev.keyCode === keycodes.ENTER;

        if (pressedReturn) {
          if (!scope.inner.term) {
            scope.inner.term = '';
          }
          ev.preventDefault();
          ev.stopPropagation();
          update();
        } else if (typeAhead && scope.inner.term) {
          return debouncedUpdate();
        }
      });

      function update () {
        scope.$apply(function (scope) {
          scope.update({
            trigger: 'keyboard'
          });
        });
      }
    },

    controller: ['$scope', function cfSearchController ($scope) {
      $scope.inner = {
        term: ''
      };

      $scope.updateFromButton = function () {
        if (!$scope.inner.term) {
          $scope.inner.term = '';
        }
        $scope.update({
          trigger: 'button'
        });
      };

      $scope.update = update;

      $scope.$watch('search', function (search) {
        $scope.inner.term = search;
      });

      $scope.$watch('inner.term', function (term) {
        if (term === '') {
          $scope.update({ trigger: 'cleared' });
        }
      });

      function update (params) {
        if ($scope.inner.term !== $scope.search) {
          $scope.search = $scope.inner.term;
        } else {
          $scope.$emit('refreshSearch', params);
        }
      }
    }]
  };
}]);
