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
    template: JST.cf_learn_view(),
    loadingText: 'Loading...',
    controller: ['$scope', function ($scope) {
      $scope.context = {ready: true};
      $scope.context.forbidden = !accessChecker.getSectionVisibility().learn;
    }]
  });
}]);
