'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/roles
 */
.factory('states/settings/roles', ['require', function (require) {
  var base = require('states/Base').default;
  var contextHistory = require('contextHistory');
  var crumbFactory = require('navigation/CrumbFactory');
  var RoleRepository = require('RoleRepository');

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading roles…',
    template: '<cf-role-list class="workbench role-list" />'
  });

  var newRole = {
    name: 'new',
    url: '/new',
    params: {
      baseRoleId: null
    },
    resolve: {
      roleRepo: ['spaceContext', function (spaceContext) {
        return RoleRepository.getInstance(spaceContext.space);
      }],
      baseRole: ['roleRepo', '$stateParams', function (roleRepo, $stateParams) {
        return $stateParams.baseRoleId ? roleRepo.get($stateParams.baseRoleId) : null;
      }]
    },
    template: '<cf-role-editor class="workbench role-editor" />',
    controller: ['$scope', 'baseRole', function ($scope, baseRole) {
      $scope.context.isNew = true;
      $scope.baseRole = baseRole;
      $scope.role = RoleRepository.getEmpty();

      contextHistory.set([
        crumbFactory.RoleList(),
        crumbFactory.Role(null, $scope.context)
      ]);
    }]
  };

  var detail = {
    name: 'detail',
    url: '/:roleId',
    resolve: {
      role: ['RoleRepository', 'spaceContext', '$stateParams', function (RoleRepository, spaceContext, $stateParams) {
        return RoleRepository.getInstance(spaceContext.space).get($stateParams.roleId);
      }]
    },
    template: '<cf-role-editor class="workbench role-editor" />',
    controller: ['$scope', '$stateParams', 'spaceContext', 'role', function ($scope, $stateParams, spaceContext, role) {
      spaceContext.publishedCTs.refresh();
      $scope.context.isNew = false;
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
