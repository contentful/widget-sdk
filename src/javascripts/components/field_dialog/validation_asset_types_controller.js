'use strict';

/**
 * Provide a list of asset types and an `update` function to set the
 * asset type validation provided by the `ValidationDialogController`.
 */
angular.module('contentful')
.controller('ValidationAssetTypesController',
            ['$scope', '$injector', function($scope, $injector) {

  var mimetype   = $injector.get('mimetype');
  var controller = this;

  controller.types = _.map(mimetype.getGroupNames(), function(label, name) {
    return {
      name: name,
      label: label,
      selected: _.contains($scope.validation.settings, name)
    };
  });

  controller.update = function() {
    $scope.validation.settings = getSelectedGroups();
    $scope.validate();
  };

  function getSelectedGroups() {
    return _(controller.types).filter('selected').map('name').value();
  }
}]);
