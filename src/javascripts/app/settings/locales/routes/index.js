import _ from 'lodash';
import * as ChangeSpaceService from 'services/ChangeSpaceService';
import * as Enforcements from 'access_control/Enforcements';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import LocalesListRoute from 'app/settings/locales/routes/LocalesListRoute';
import LocalesNewRoute from 'app/settings/locales/routes/LocalesNewRoute';
import LocalesEditRoute from 'app/settings/locales/routes/LocalesEditRoute';

export default {
  name: 'locales',
  url: '/locales',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: LocalesListRoute,
      mapInjectedToProps: [
        'spaceContext',
        spaceContext => ({
          showUpgradeSpaceDialog: ({ onSubmit }) => {
            ChangeSpaceService.showDialog({
              organizationId: spaceContext.organization.sys.id,
              space: spaceContext.space.data,
              action: 'change',
              scope: 'space',
              onSubmit
            });
          },
          getComputeLocalesUsageForOrganization: () => {
            return Enforcements.computeUsageForOrganization(spaceContext.organization, 'locale');
          }
        })
      ]
    },
    {
      name: 'new',
      url: '_new',
      component: LocalesNewRoute,
      mapInjectedToProps: [
        '$scope',
        '$state',
        ($scope, $state) => ({
          registerSaveAction: save => {
            $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
            $scope.$applyAsync();
          },
          setDirty: value => {
            $scope.context.dirty = value;
            $scope.$applyAsync();
          },
          goToList: () => {
            $state.go('^.list');
          }
        })
      ]
    },
    {
      name: 'detail',
      url: '/:localeId',
      component: LocalesEditRoute,
      mapInjectedToProps: [
        '$scope',
        '$stateParams',
        '$state',
        ($scope, $stateParams, $state) => ({
          localeId: $stateParams.localeId,
          registerSaveAction: save => {
            $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
            $scope.$applyAsync();
          },
          setDirty: value => {
            $scope.context.dirty = value;
            $scope.$applyAsync();
          },
          goToList: () => {
            $state.go('^.list');
          }
        })
      ]
    }
  ]
};
