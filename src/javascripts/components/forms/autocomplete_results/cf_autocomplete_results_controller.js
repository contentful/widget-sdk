'use strict';

angular.module('contentful').controller('CfAutocompleteResultsController', ['$scope', '$attrs', '$parse', function ($scope, $attrs, $parse) {
  const controller = this;
  const getAutocompleteResults = $parse($attrs.cfAutocompleteResults);
  this.selectedIndex = -1;
  this.numResults = 0;

  let unwatchResults = $scope.$watch(
    getAutocompleteResults,
  results => {
    if (_.isEmpty(results)) {
      controller.selectedIndex = -1;
      controller.numResults = 0;
    } else {
      controller.selectedIndex = 0;
      controller.numResults = results.length;
    }
  });

  this.getSelectedResult = function () {
    const results = getAutocompleteResults($scope);
    return results[this.selectedIndex];
  };

  this.selectNext = function () {
    if (this.numResults === 0) return false;
    if (this.selectedIndex < this.numResults - 1) {
      this.selectedIndex++;
      $scope.$broadcast('autocompleteResultSelected', this.selectedIndex, this.getSelectedResult());
    }
    return true;
  };

  this.selectPrevious = function () {
    if (this.numResults === 0) return false;
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      $scope.$broadcast('autocompleteResultSelected', this.selectedIndex, this.getSelectedResult());
    }
    return true;
  };

  this.pickSelected = function () {
    if (this.selectedIndex < 0) return false;
    $scope.$emit('autocompleteResultPicked', this.selectedIndex, this.getSelectedResult());
    return true;
  };

  this.cancelAutocomplete = function cancelAutocomplete () {
    const event = $scope.$emit('autocompleteResultsCancel');
    // If default prevent that means the search was already
    // canceled and that means we didn't really handle anything
    return !event.defaultPrevented;
  };

  $scope.$on('$destroy', () => {
    unwatchResults();
    unwatchResults = null;
    $scope = null; // MEMLEAK FIX
  });
}]);
