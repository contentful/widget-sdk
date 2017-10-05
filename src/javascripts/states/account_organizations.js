'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account/organizations', ['require', function (require) {
  var base = require('states/base');
  var h = require('utils/hyperscript').h;
  var workbenchHeader = require('app/Workbench').header;

  var newOrg = base({
    name: 'new',
    url: '/new',
    label: 'Create new organization',
    views: {
      // Override org navbar from paremt state
      'nav-bar@': { template: '' }
    },
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    template: [
      workbenchHeader('Create new organization'),
      h('cf-account-view', { context: 'context' })
    ].join('')
  });

  var edit = organizationsBase({
    name: 'edit',
    title: 'Organization information',
    url: '/:orgId/edit{pathSuffix:PathSuffix}'
  });

  var subscription = organizationsBase({
    name: 'subscription',
    title: 'Subscription',
    url: '/:orgId/z_subscription{pathSuffix:PathSuffix}'
  });

  var users = organizationsBase({
    name: 'users',
    title: 'Organization users',
    url: '/:orgId/organization_memberships{pathSuffix:PathSuffix}'
  });

  var spaces = organizationsBase({
    name: 'spaces',
    title: 'Organization spaces',
    url: '/:orgId/spaces{pathSuffix:PathSuffix}'
  });

  var offsitebackup = organizationsBase({
    name: 'offsitebackup',
    title: 'Offsite backup',
    url: '/:orgId/offsite_backup/edit{pathSuffix:PathSuffix}'
  });

  var billing = organizationsBase({
    name: 'billing',
    title: 'Billing',
    url: '/:orgId/z_billing{pathSuffix:PathSuffix}'
  });

  function organizationsBase (definition) {
    var defaults = {
      label: 'Organizations & Billing',
      controller: ['$scope', 'require', function ($scope, require) {
        var TheStore = require('TheStore');
        var $stateParams = require('$stateParams');

        $scope.context = {};
        TheStore.set('lastUsedOrg', $stateParams.orgId);
      }],
      params: {
        pathSuffix: ''
      },
      template: [
        workbenchHeader(definition.title),
        h('cf-account-view', { context: 'context' })
      ].join('')
    };
    return base(_.extend(definition, defaults));
  }

  return base({
    name: 'organizations',
    url: '/organizations',
    abstract: true,
    views: {
      'nav-bar@': {
        template: h('cf-organization-nav', { class: 'app-top-bar__child' })
      }
    },
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
