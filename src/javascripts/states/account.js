'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account', [function () {
  var pathSuffix = {
    name: '.pathSuffix',
    url: '/{pathSuffix:PathSuffix}',
    params: {
      pathSuffix: 'profile/user'
    },
    ncyBreadcrumb: {
      label: 'Account'
    }
  };

  return {
    name: 'account',
    url: '/account',
    abstract: true,
    views: {
      'content': {
        template: '<cf-account-view>'
      }
    },
    onEnter: ['TheAccountView', function (view) { view.enter(); }],
    onExit:  ['TheAccountView', function (view) { view.exit();  }],
    children: [pathSuffix]
  };
}]);
