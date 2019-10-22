import base from 'states/Base.es6';
import RoleRepository from 'access_control/RoleRepository';
import RoleEditor from '../role_editor/RoleEditor';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog.es6';

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
  component: RoleEditor,
  mapInjectedToProps: [
    '$scope',
    'baseRole',
    ($scope, baseRole) => {
      return {
        isNew: true,
        role: RoleRepository.getEmpty(),
        baseRole,
        registerSaveAction: save => {
          $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
          $scope.$applyAsync();
        },
        setDirty: value => {
          $scope.context.dirty = value;
          $scope.$applyAsync();
        }
      };
    }
  ]
};

const detail = {
  name: 'detail',
  url: '/:roleId',
  onEnter: [
    'spaceContext',
    spaceContext => {
      spaceContext.publishedCTs.refresh();
    }
  ],
  resolve: {
    role: [
      'spaceContext',
      '$stateParams',
      (spaceContext, $stateParams) =>
        RoleRepository.getInstance(spaceContext.space).get($stateParams.roleId)
    ]
  },
  component: RoleEditor,
  mapInjectedToProps: [
    '$scope',
    'role',
    ($scope, role) => {
      return {
        isNew: false,
        role,
        registerSaveAction: save => {
          $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
          $scope.$applyAsync();
        },
        setDirty: value => {
          $scope.context.dirty = value;
          $scope.$applyAsync();
        }
      };
    }
  ]
};

export default {
  name: 'roles',
  url: '/roles',
  abstract: true,
  children: [newRole, detail, list]
};
