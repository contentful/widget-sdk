'use strict';

angular.module('contentful')
.controller('apiContentModelController', ['$scope', '$injector', function ($scope, $injector) {

  var spaceContext = $injector.get('spaceContext');
  var accessChecker = $injector.get('accessChecker');

  spaceContext.publishedCTs.refresh().then(function (contentTypes) {
    $scope.contentTypes = contentTypes;
  }, accessChecker.wasForbidden($scope.context));

}]);
