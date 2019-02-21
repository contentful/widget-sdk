import base from 'states/Base.es6';
import contextHistory from 'navigation/Breadcrumbs/History.es6';
import * as crumbFactory from 'navigation/Breadcrumbs/Factory.es6';
import RoleRepository from 'access_control/RoleRepository.es6';

const list = base({
  name: 'list',
  url: '',
  loadingText: 'Loading roles…',
  template: '<cf-role-list class="workbench role-list" />'
});

const newRole = {
  name: 'new',
  url: '/new',
  params: {
    baseRoleId: null
  },
  resolve: {
    roleRepo: ['spaceContext', spaceContext => RoleRepository.getInstance(spaceContext.space)],
    baseRole: [
      'roleRepo',
      '$stateParams',
      (roleRepo, $stateParams) =>
        $stateParams.baseRoleId ? roleRepo.get($stateParams.baseRoleId) : null
    ]
  },
  template: '<react-component name="access_control/RoleEditor.es6" props="props" />',
  controller: [
    '$scope',
    'baseRole',
    'navigation/confirmLeaveEditor',
    ($scope, baseRole, leaveConfirmator) => {
      $scope.props = {
        isNew: true,
        role: RoleRepository.getEmpty(),
        baseRole,
        registerSaveAction: save => {
          $scope.context.requestLeaveConfirmation = leaveConfirmator(save);
          $scope.$applyAsync();
        },
        setDirty: value => {
          $scope.context.dirty = value;
          $scope.$applyAsync();
        }
      };

      contextHistory.set([crumbFactory.RoleList(), crumbFactory.Role(null, $scope.context)]);
    }
  ]
};

const detail = {
  name: 'detail',
  url: '/:roleId',
  resolve: {
    role: [
      'access_control/RoleRepository.es6',
      'spaceContext',
      '$stateParams',
      (RoleRepository, spaceContext, $stateParams) =>
        RoleRepository.getInstance(spaceContext.space).get($stateParams.roleId)
    ]
  },
  template: '<react-component name="access_control/RoleEditor.es6" props="props" />',
  controller: [
    '$scope',
    '$stateParams',
    'spaceContext',
    'role',
    'navigation/confirmLeaveEditor',
    ($scope, $stateParams, spaceContext, role, leaveConfirmator) => {
      $scope.props = {
        isNew: false,
        role,
        registerSaveAction: save => {
          $scope.context.requestLeaveConfirmation = leaveConfirmator(save);
          $scope.$applyAsync();
        },
        setDirty: value => {
          $scope.context.dirty = value;
          $scope.$applyAsync();
        }
      };

      spaceContext.publishedCTs.refresh();

      contextHistory.set([
        crumbFactory.RoleList(),
        crumbFactory.Role($stateParams.roleId, $scope.context)
      ]);
    }
  ]
};

export default {
  name: 'roles',
  url: '/roles',
  abstract: true,
  children: [newRole, detail, list]
};
