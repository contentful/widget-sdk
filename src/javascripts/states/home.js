'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/home
 */
.factory('states/home', ['require', function (require) {
  var base = require('states/base');

  return base({
    name: 'home',
    url: '',
    template: '<cf-home />',
    loadingText: 'Loading...',
    controller: ['$scope', function ($scope) {
      $scope.context = {ready: true};
    }]
  });
}]);
