'use strict';

/**
 * Render a list of published content types with checkboxes that toggle
 * whether the content type is acceptable for this link field.
 */
angular.module('contentful')
.directive('cfValidationLinkType', function() {
  return {
    restrict: 'E',
    template: JST['cf_validation_link_type'](),
    controller: ['$scope', function($scope) {

      $scope.$watch('spaceContext.publishedContentTypes', function(contentTypes) {
        $scope.contentTypes = _.map(contentTypes, decorateContentType);
      });

      $scope.update = function() {
        $scope.validation.settings = getSelectedIDs();
        $scope.validationsController.update();
      };

      function decorateContentType(ct) {
        var id = ct.getId();
        return {
          id: id,
          selected: isSelected(id),
          name: ct.getName()
        };
      }

      function getSelectedIDs() {
        return _($scope.contentTypes).filter('selected').map('id').value();
      }

      function isSelected(contentTypeId) {
        return _.contains($scope.validation.settings, contentTypeId);
      }

    }]
  };
});
