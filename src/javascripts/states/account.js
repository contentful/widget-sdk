'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account', ['$injector', function ($injector) {
  var base = $injector.get('states/base');

  var pathSuffix = base({
    name: 'pathSuffix',
    url: '/{pathSuffix:PathSuffix}',
    label: 'Account',
    template: '<cf-account-view />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  });

  return {
    name: 'account',
    url: '/account',
    abstract: true,
    onEnter: ['TheAccountView', function (view) { view.enter(); }],
    onExit: ['TheAccountView', function (view) { view.exit(); }],
    children: [pathSuffix]
  };
}]);
