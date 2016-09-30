'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/roles
 */
.factory('states/settings/roles', ['require', function (require) {
  var base = require('states/base');
  var contextHistory = require('contextHistory');

  var listEntity = {
    getTitle: function () { return list.label; },
    link: { state: 'spaces.detail.settings.roles.list' },
    getType: _.constant('Roles'),
    getId: _.constant('ROLES')
  };

  var list = base({
    name: 'list',
    url: '',
    label: 'Roles',
    loadingText: 'Loading Roles...',
    template: '<cf-role-list class="workbench role-list" />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
      contextHistory.addEntity(listEntity);
    }]
  });

  var newRole = {
    name: 'new',
    url: '/new',
    params: {
      baseRoleId: null,
      addToContext: true
    },
    data: {
      isNew: true
    },
    label: 'context.title + (context.dirty ? "*" : "")',
    resolve: {
      baseRole: ['RoleRepository', 'space', '$stateParams', '$q', function (RoleRepository, space, $stateParams, $q) {
        if (!$stateParams.baseRoleId) { return $q.when(null); }
        return RoleRepository.getInstance(space).get($stateParams.baseRoleId);
      }],
      emptyRole: ['RoleRepository', '$q', function (RoleRepository, $q) {
        return $q.when(RoleRepository.getEmpty());
      }]
    },
    template: '<cf-role-editor class="workbench role-editor" />',
    controller: ['$scope', '$state', 'baseRole', 'emptyRole', function ($scope, $state, baseRole, emptyRole) {
      $scope.context = $state.current.data;
      $scope.baseRole = baseRole;
      $scope.role = emptyRole;

      // parent is list view
      contextHistory.addEntity(listEntity);

      // add current view
      contextHistory.addEntity({
        getTitle: function () { return $scope.context.title + ($scope.context.dirty ? '*' : ''); },
        link: {
          state: 'spaces.detail.settings.roles.new'
        },
        getType: _.constant('Role'),
        getId: _.constant('ROLENEW')
      });
    }]
  };

  var detail = {
    name: 'detail',
    url: '/:roleId',
    params: { addToContext: true },
    data: {
      isNew: false
    },
    label: 'context.title + (context.dirty ? "*" : "")',
    resolve: {
      role: ['RoleRepository', 'space', '$stateParams', function (RoleRepository, space, $stateParams) {
        return RoleRepository.getInstance(space).get($stateParams.roleId);
      }],
      contentTypes: ['spaceContext', function (spaceContext) {
        return spaceContext.refreshContentTypes();
      }]
    },
    template: '<cf-role-editor class="workbench role-editor" />',
    controller: ['$scope', 'require', 'role', function ($scope, require, role) {
      var $state = require('$state');
      var $stateParams = require('$stateParams');

      var roleId = $stateParams.roleId;

      $scope.context = $state.current.data;
      $scope.role = role;

      // parent is list view
      contextHistory.addEntity(listEntity);

      // add current view
      contextHistory.addEntity({
        getTitle: function () { return $scope.context.title + ($scope.context.dirty ? '*' : ''); },
        link: {
          state: 'spaces.detail.settings.roles.detail',
          params: { roleId: roleId }
        },
        getType: _.constant('Role'),
        getId: _.constant(roleId)
      });
    }]
  };

  return {
    name: 'roles',
    url: '/roles',
    abstract: true,
    children: [newRole, detail, list]
  };
}]);
