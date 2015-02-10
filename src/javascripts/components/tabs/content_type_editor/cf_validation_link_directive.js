'use strict';

angular.module('contentful')
.directive('cfValidationLink', function() {
  return {
    restrict: 'E',
    template: JST['cf_validation_link'](),
    controller: ['$scope', function($scope) {
      $scope.$watch('spaceContext.publishedContentTypes', function(contentTypes) {
        $scope.contentTypes = _.map(contentTypes, decorateContentType);
      });

      function decorateContentType(ct) {
        var id = ct.getId();
        return {
          id: id,
          selected: isSelected(id),
          name: ct.getName()
        };
      }

      $scope.update = function() {
        $scope.validation.settings =
          _($scope.contentTypes).filter('selected').map('id').value();
        $scope.validationsController.update();
      };

      function isSelected(contentTypeId) {
        return _.contains($scope.validation.settings, contentTypeId);
      }

    }]
  };
});
