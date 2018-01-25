'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account', ['require', function (require) {
  var base = require('states/Base').default;
  var navBar = require('navigation/templates/NavBar').default;

  return base({
    name: 'account',
    url: '/account',
    abstract: true,
    views: { 'nav-bar': { template: navBar() } },
    children: [
      require('states/account/organizations'),
      require('states/account/profile')
    ]
  });
}]);
