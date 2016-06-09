'use strict';

angular.module('contentful')
.controller('apiContentModelController', ['$scope', '$injector', function ($scope, $injector) {

  var spaceContext = $injector.get('spaceContext');
  var accessChecker = $injector.get('accessChecker');

  spaceContext.refreshContentTypes().then(function () {
    $scope.contentTypes = spaceContext.getFilteredAndSortedContentTypes();
  }, accessChecker.wasForbidden($scope.context));

}]);
