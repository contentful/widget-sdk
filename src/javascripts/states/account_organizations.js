'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account/organizations', ['require', function (require) {
  var base = require('states/base');
  var h = require('utils/hyperscript').h;

  var newOrg = organizationsBase({
    name: 'new',
    url: '/new'
  });

  var edit = organizationsBase({
    name: 'edit',
    url: '/:orgId/edit{pathSuffix:PathSuffix}'
  });

  var subscription = organizationsBase({
    name: 'subscription',
    url: '/:orgId/z_subscription{pathSuffix:PathSuffix}'
  });

  var users = organizationsBase({
    name: 'users',
    url: '/:orgId/organization_memberships{pathSuffix:PathSuffix}'
  });

  var spaces = organizationsBase({
    name: 'spaces',
    url: '/:orgId/spaces{pathSuffix:PathSuffix}'
  });

  var offsitebackup = organizationsBase({
    name: 'offsitebackup',
    url: '/:orgId/offsite_backup{pathSuffix:PathSuffix}'
  });

  var billing = organizationsBase({
    name: 'billing',
    url: '/:orgId/z_billing{pathSuffix:PathSuffix}'
  });

  function organizationsBase (definition) {
    var defaults = {
      label: 'Organizations & Billing',
      controller: ['$scope', function ($scope) {
        $scope.context = {};
      }],
      params: {
        pathSuffix: ''
      },
      template: [h('cf-account-organizations-nav'), h('cf-account-view')].join('')
    };
    return base(_.extend(definition, defaults));
  }

  return base({
    name: 'organizations',
    url: '/organizations',
    abstract: true,
    children: [
      newOrg,
      edit,
      subscription,
      users,
      spaces,
      offsitebackup,
      billing
    ]
  });
}]);
