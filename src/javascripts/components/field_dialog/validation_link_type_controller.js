'use strict';

/**
 * Render a list of published content types with checkboxes that toggle
 * whether the content type is acceptable for this link field.
 */
angular.module('contentful')
.controller('ValidationLinkTypeController', ['$scope', '$injector', function ($scope, $injector) {

  var spaceContext = $injector.get('spaceContext');

  spaceContext.refreshContentTypes().then(function () {
    var filtered = spaceContext.getFilteredAndSortedContentTypes();
    $scope.contentTypes = _.map(filtered, decorateContentType);
  });

  $scope.update = function() {
    $scope.validation.settings = getSelectedIDs();
    $scope.validator.run();
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
    return _.includes($scope.validation.settings, contentTypeId);
  }

}]);
