'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/home
 */
.factory('states/home', ['require', function (require) {
  var base = require('states/base');
  var $location = require('$location');

  return base({
    name: 'home',
    url: '/*path',
    template: JST.cf_home(),
    loadingText: 'Loading...',
    controller: ['$scope', function ($scope) {
      $scope.context = {ready: false};

      // if this state was loaded, but we don't
      // recognize the URL, redirect to /
      if (_.includes(['', '/'], $location.url())) {
        $scope.context.ready = true;
      } else {
        $location.url('/');
      }
    }]
  });
}]);
