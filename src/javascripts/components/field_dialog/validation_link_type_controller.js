'use strict';

/**
 * Render a list of published content types with checkboxes that toggle
 * whether the content type is acceptable for this link field.
 */
angular.module('contentful')
.controller('ValidationLinkTypeController', ['require', '$scope', function (require, $scope) {
  var spaceContext = require('spaceContext');
  var K = require('utils/kefir');

  K.onValueScope($scope, spaceContext.publishedCTs.items$, function (cts) {
    $scope.contentTypes = cts.map(decorateContentType);
  });

  $scope.update = function () {
    $scope.validation.settings = getSelectedIDs();
    $scope.validator.run();
  };

  function decorateContentType (ct) {
    var id = ct.sys.id;
    return {
      id: id,
      selected: isSelected(id),
      name: ct.name || 'Untitled'
    };
  }

  function getSelectedIDs () {
    return _($scope.contentTypes).filter('selected').map('id').value();
  }

  function isSelected (contentTypeId) {
    return _.includes($scope.validation.settings, contentTypeId);
  }
}]);
