'use strict';

angular.module('contentful')
.directive('cfApiContentType', function () {
  return {
    template: JST['api_content_type'](),
    restrict: 'E',
    scope: true,
    controller: 'apiContentTypeController'
  };
})

.controller('apiContentTypeController', ['$scope', '$injector', function ($scope, $injector) {

  var contentModelFieldTypes = $injector.get('contentModelFieldTypes');

  $scope.isExpanded = false;

  $scope.toggleFields = function () {
    $scope.isExpanded = !$scope.isExpanded;
  };

  $scope.getHelpText = function (type) {
    var fieldType = contentModelFieldTypes[type];

    if (!fieldType) {
      throw new Error('No type for ' + type);
    }
    return '<p>' + fieldType.description + '</p>' +
           '<p>JSON Primitive: ' + fieldType.jsonType + '</p>';
  };

}]);
