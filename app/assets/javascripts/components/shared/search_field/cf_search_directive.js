'use strict';

angular.module('contentful').directive('cfSearch', function(keycodes, debounce){

  return {
    template: JST['cf_search'](),
    scope: {
      placeholder: '@',
      search: '=cfSearch',
      tooltip: '@'
    },

    link: function(scope, element, attr) {
      var typeAhead = 'searchTypeAhead' in attr;

      function update() {
        scope.$apply(function (scope) {
          scope.update({
            trigger: 'keyboard'
          });
        });
      }

      var debouncedUpdate = debounce(update, 300);

      element.on('keydown', function(ev) {
        if (typeAhead && scope.inner.term) return debouncedUpdate();
        var pressedReturn = ev.keyCode === keycodes.ENTER;
        if (pressedReturn) {
          if(!scope.inner.term) scope.inner.term = '';
          ev.preventDefault();
          ev.stopPropagation();
          update();
        }
      });
    },

    controller: function cfSearchController($scope) {
      $scope.inner = {
        term: ''
      };

      $scope.searchFieldFocused = function () {
        $scope.$emit('searchFieldFocused');
      };

      $scope.updateFromButton = function () {
        if(!$scope.inner.term) $scope.inner.term = '';
        $scope.update({
          trigger: 'button'
        });
      };

      $scope.update = function(params) {
        if($scope.inner.term !== $scope.search)
          $scope.search = $scope.inner.term;
        else
          $scope.$emit('refreshSearch', params);
      };

      $scope.$watch('search', function(search) {
        $scope.inner.term = search;
      });

    }
  };
});


