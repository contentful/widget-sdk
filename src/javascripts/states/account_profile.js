'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account/profile', ['require', function (require) {
  var base = require('states/base');

  var user = userBase({
    name: 'user',
    url: '/user{pathSuffix:PathSuffix}'
  });

  var spaceMemberships = userBase({
    name: 'space_memberships',
    url: '/space_memberships{pathSuffix:PathSuffix}'
  });

  var organizationMemberships = userBase({
    name: 'organization_memberships',
    url: '/organization_memberships{pathSuffix:PathSuffix}'
  });

  var accessGrants = userBase({
    name: 'access_grants',
    url: '/access_grants{pathSuffix:PathSuffix}'
  });

  var applications = userBase({
    name: 'applications',
    url: '/developers/applications{pathSuffix:PathSuffix}'
  });

  function userBase (definition) {
    var defaults = {
      label: 'Account',
      controller: ['$scope', function ($scope) {
        $scope.context = {};
      }],
      params: {
        pathSuffix: ''
      },
      template: (
        '<cf-account-profile-nav></cf-account-profile-nav>' +
        '<cf-account-view></cf-account-view>'
      )
    };

    return base(_.extend(definition, defaults));
  }

  return base({
    name: 'profile',
    url: '/profile',
    abstract: true,
    onEnter: ['TheAccountView', function (view) { view.enter(); }],
    onExit: ['TheAccountView', function (view) { view.exit(); }],
    children: [
      user,
      spaceMemberships,
      organizationMemberships,
      accessGrants,
      applications
    ]
  });
}]);
