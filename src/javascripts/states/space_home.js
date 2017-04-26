'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/space_home
 */
.factory('states/space_home', ['require', function (require) {
  var base = require('states/base');
  var accessChecker = require('accessChecker');
  var template = require('app/home/HomeTemplate').default;

  return base({
    name: 'home',
    url: '/home',
    label: 'Space home',
    template: template(),
    loadingText: 'Loading...',
    controller: ['$scope', function ($scope) {
      $scope.context = {ready: true};
      $scope.context.forbidden = !accessChecker.getSectionVisibility().spaceHome;
    }]
  });
}]);
