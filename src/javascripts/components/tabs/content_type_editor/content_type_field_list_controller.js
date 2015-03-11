'use strict';

angular.module('contentful').controller('ContentTypeFieldListController', ['$scope', '$injector', function($scope, $injector) {
  var $controller = $injector.get('$controller');

  $controller('AccordionController', {$scope: $scope});

  $scope.fieldTypeParams = function (f) {
    var params = [f.type, f.linkType];
    if (f.items) params.push(f.items.type, f.items.linkType);
    return params;
  };

  $scope.fieldIsPublished = function (field) {
    if (!$scope.publishedContentType || !$scope.publishedContentType.data) return false;
    return _.contains($scope.publishedIds, field.id);
  };

  $scope.pickNewDisplayField = function () {
    var current = _.find($scope.contentType.data.fields, {id: $scope.contentType.data.displayField});
    var currentIsFine = current && displayEnabled(current);
    if (!currentIsFine) {
      var firstEnabled = _.find($scope.contentType.data.fields, displayEnabled);
      if (firstEnabled) $scope.setDisplayField(firstEnabled);
      else $scope.removeDisplayField();
    }

    function displayEnabled(field) {
      return field.type === 'Symbol' || field.type === 'Text';
    }
  };

  $scope.setDisplayField = function (field) {
    $scope.contentType.data.displayField = field.id;
  };

  $scope.removeDisplayField = function () {
    $scope.contentType.data.displayField = null;
  };

  $scope.$watch('validationResult.errors', function activateErroredDisabledFields(errors, old, scope) {
    _.each(errors, function (error) {
      if (error.path[0] === 'fields' && angular.isDefined(error.path[1])) {
        var field = scope.contentType.data.fields[error.path[1]];
        if (field.disabled) scope.preferences.showDisabledFields = true;
      }
    });
  });

  $scope.$on('fieldAdded', function (event, index) {
    var scope = event.currentScope;
    scope.openAccordionItem(scope.contentType.data.fields[index]);
  });
}]);
