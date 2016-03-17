'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/roles
 */
.factory('states/settings/roles', ['$injector', function ($injector) {
  var base = $injector.get('states/base');

  var list = base({
    name: 'list',
    url: '',
    ncyBreadcrumb: { label: 'Roles' },
    loadingText: 'Loading Roles...',
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
    ncyBreadcrumb: {
      parent: 'spaces.detail.settings.roles.list',
      label: '{{ context.title + (context.dirty ? "*" : "") }}'
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
    }]
  };

  var detail = {
    name: 'detail',
    url: '/:roleId',
    data: {
      isNew: false
    },
    ncyBreadcrumb: {
      parent: 'spaces.detail.settings.roles.list',
      label: '{{ context.title + (context.dirty ? "*" : "") }}'
    },
    resolve: {
      role: ['RoleRepository', 'space', '$stateParams', function (RoleRepository, space, $stateParams) {
        return RoleRepository.getInstance(space).get($stateParams.roleId);
      }]
    },
    template: '<cf-role-editor class="workbench role-editor" />',
    controller: ['$scope', '$state', 'role', function ($scope, $state, role) {
      $scope.context = $state.current.data;
      $scope.role = role;
    }]
  };

  return {
    name: 'roles',
    url: '/roles',
    abstract: true,
    template: '<ui-view />',
    children: [newRole, detail, list]
  };
}]);
