'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account', ['require', function (require) {
  var base = require('states/base');

  return base({
    name: 'account',
    url: '/account',
    abstract: true,
    template: '<cf-account-view />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    children: [{
      name: 'pathSuffix',
      url: '/{pathSuffix:PathSuffix}',
      label: 'Account'
    }]
  });
}]);
