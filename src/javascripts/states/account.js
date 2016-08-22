'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account', ['$injector', function ($injector) {
  var base = $injector.get('states/base');

  return {
    name: 'account',
    url: '/account',
    abstract: true,
    views: {
      'content': base({
        template: '<cf-account-view />',
        controller: ['$scope', function ($scope) {
          $scope.context = {};
        }]
      })
    },
    onEnter: ['TheAccountView', function (view) { view.enter(); }],
    onExit:  ['TheAccountView', function (view) { view.exit();  }],
    children: [{
      name: 'pathSuffix',
      url: '/{pathSuffix:PathSuffix}',
      ncyBreadcrumb: {label: 'Account'}
    }]
  };
}]);
