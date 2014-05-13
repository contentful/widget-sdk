'use strict';
angular.module('contentful').directive('cfAutocompleteList', function(){
  return {
    restrict: 'A',
    scope: true,
    template: JST['cf_autocomplete_list'](),
    controller: function ($scope) {
      selectNextAutocompletion();

      $scope.$on('selectNextAutocompletion', function () {
        selectNextAutocompletion();
      });

      $scope.$on('selectPreviousAutocompletion', function () {
        selectPreviousAutocompletion();
      });

      $scope.$on('cancelAutocompletion', function () {
        // TODO probably unnecessessary, because the directive should be destroyed
        $scope.selectedAutocompletion = null;
      });

      $scope.$on('submitAutocompletion', function () {
        // TODO probably unnecessessary, because the directive should be destroyed
        $scope.selectedAutocompletion = null;
      });

      function selectNextAutocompletion(){
        var index = _.indexOf($scope.autocompletion.values, $scope.selectedAutocompletion);
        $scope.selectedAutocompletion = $scope.autocompletion.values[index+1] || $scope.autocompletion.values[0];
        if ($scope.selectedAutocompletion) $scope.fillAutocompletion($scope.selectedAutocompletion);
      }

      function selectPreviousAutocompletion(){
        var index = _.indexOf($scope.autocompletion.values, $scope.selectedAutocompletion);
        $scope.selectedAutocompletion = $scope.autocompletion.values[index-1] || $scope.autocompletion.values[$scope.autocompletions.length-1];
        if ($scope.selectedAutocompletion) $scope.fillAutocompletion($scope.selectedAutocompletion);
      }

    }
  };
});
