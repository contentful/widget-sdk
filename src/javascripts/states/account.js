'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account', ['require', function (require) {
  var base = require('states/base');
  var TheAccountView = require('TheAccountView');
  var analytics = require('analytics');

  return base({
    name: 'account',
    url: '/account',
    abstract: true,
    template: '<cf-account-view />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    onEnter: function () {
      TheAccountView.enter();
      analytics.trackSpaceChange(null);
    },
    onExit: TheAccountView.exit,
    children: [{
      name: 'pathSuffix',
      url: '/{pathSuffix:PathSuffix}',
      label: 'Account'
    }]
  });
}]);
