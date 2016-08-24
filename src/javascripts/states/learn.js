'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/learn
 */
.factory('states/learn', ['require', function (require) {
  var base = require('states/base');
  var accessChecker = require('accessChecker');

  return base({
    name: 'learn',
    url: '/learn',
    label: 'Learn',
    template: '<cf-learn-view />',
    loadingText: 'Loading...',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
      $scope.context.forbidden = !accessChecker.getSectionVisibility().learn;
    }]
  });
}]);
