'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/roles
 */
.factory('states/settings/roles', ['require', function (require) {
  var base = require('states/base');
  var contextHistory = require('contextHistory');
  var crumbFactory = require('navigation/CrumbFactory');

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading roles...',
    template: '<cf-role-list class="workbench role-list" />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  });

  var newRole = {
    name: 'new',
    url: '/new',
    params: {
      baseRoleId: null
    },
    data: {
      isNew: true
    },
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

      contextHistory.set([
        crumbFactory.RoleList(),
        crumbFactory.Role(null, $scope.context)
      ]);
    }]
  };

  var detail = {
    name: 'detail',
    url: '/:roleId',
    data: {
      isNew: false
    },
    resolve: {
      role: ['RoleRepository', 'space', '$stateParams', function (RoleRepository, space, $stateParams) {
        return RoleRepository.getInstance(space).get($stateParams.roleId);
      }]
    },
    template: '<cf-role-editor class="workbench role-editor" />',
    onEnter: ['spaceContext', function (spaceContext) {
      spaceContext.publishedCTs.refresh();
    }],
    controller: ['$scope', 'require', 'role', function ($scope, require, role) {
      var $state = require('$state');
      var $stateParams = require('$stateParams');


      $scope.context = $state.current.data;
      $scope.role = role;

      contextHistory.set([
        crumbFactory.RoleList(),
        crumbFactory.Role($stateParams.roleId, $scope.context)
      ]);
    }]
  };

  return {
    name: 'roles',
    url: '/roles',
    abstract: true,
    children: [newRole, detail, list]
  };
}]);
