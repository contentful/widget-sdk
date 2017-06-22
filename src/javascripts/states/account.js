'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account', ['require', function (require) {
  var base = require('states/base');
  var navBar = require('app/NavBar').default;

  return base({
    name: 'account',
    url: '/account',
    abstract: true,
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    views: { 'nav-bar': { template: navBar() } },
    children: [
      require('states/account/organizations'),
      require('states/account/profile')
    ]
  });
}]);
