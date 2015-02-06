'use strict';

angular.module('contentful').directive('cfFormWidget', function() {
  return {
    restrict: 'E',
    controller: ['$scope', function($scope) {
      $scope.$watch('widget.field', function (field) {
        $scope.field = field;
      });

      $scope.$watch('widget.widgetParams.helpText', function (helpText) {
        $scope.helpText = helpText;
      });

      $scope.$watch('widget.locales', function(locales) {
        $scope.locales = locales;
      });

      $scope.$watch('widget.rendersHelpText', function (rendersHelpText) {
        $scope.showHelpText = !rendersHelpText;
      });
    }]
  };
});
