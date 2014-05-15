'use strict';
angular.module('contentful').directive('cfAutocompleteList', function(){
  return {
    restrict: 'A',
    scope: true,
    template: JST['cf_autocomplete_list'](),
    controller: function ($scope) {
      //selectInitialAutocompletion();

      $scope.$on('selectNextAutocompletion', function () {
        selectNextAutocompletion();
        if ($scope.selectedAutocompletion) $scope.fillAutocompletion($scope.selectedAutocompletion.value);
      });

      $scope.$on('selectPreviousAutocompletion', function () {
        selectPreviousAutocompletion();
        if ($scope.selectedAutocompletion) $scope.fillAutocompletion($scope.selectedAutocompletion.value);
      });

      $scope.$on('cancelAutocompletion', function () {
        // TODO probably unnecessessary, because the directive should be destroyed
        $scope.selectedAutocompletion = null;
      });

      $scope.$on('submitAutocompletion', function () {
        // TODO probably unnecessessary, because the directive should be destroyed
        $scope.selectedAutocompletion = null;
      });

      $scope.$watch('autocompletion.items', selectInitialAutocompletion);

      function selectInitialAutocompletion() {
        var token = $scope.currentTokenContent();
        $scope.selectedAutocompletion = _.find($scope.autocompletion.items, function (i) {
          return i.value.toString() === token;
        }) || $scope.autocompletion.items[0];
      }

      function selectNextAutocompletion(){
        var index = getSelectedIndex();
        $scope.selectedAutocompletion = $scope.autocompletion.items[index+1] || $scope.autocompletion.items[0];
      }

      function selectPreviousAutocompletion(){
        var index = getSelectedIndex();
        $scope.selectedAutocompletion = $scope.autocompletion.items[index-1] || $scope.autocompletion.items[$scope.autocompletion.items.length-1];
      }

      function getSelectedIndex() {
        return _.findIndex($scope.autocompletion.items, function (i) {
          return i.value === ($scope.selectedAutocompletion && $scope.selectedAutocompletion.value);
        });
      }

    }
  };
});
