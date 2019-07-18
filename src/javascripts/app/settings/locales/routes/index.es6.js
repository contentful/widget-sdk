import _ from 'lodash';
import * as ChangeSpaceService from 'services/ChangeSpaceService.es6';
import * as Enforcements from 'access_control/Enforcements.es6';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog.es6';

export default {
  name: 'locales',
  url: '/locales',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      template:
        '<react-component name="app/settings/locales/routes/LocalesListRoute.es6" props="props" />',
      controller: [
        '$scope',
        'spaceContext',
        ($scope, spaceContext) => {
          $scope.props = {
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
          };
        }
      ]
    },
    {
      name: 'new',
      url: '_new',
      template:
        '<react-component name="app/settings/locales/routes/LocalesNewRoute.es6" props="props" />',
      controller: [
        '$scope',
        '$state',
        ($scope, $state) => {
          $scope.props = {
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
          };
        }
      ]
    },
    {
      name: 'detail',
      url: '/:localeId',
      template:
        '<react-component name="app/settings/locales/routes/LocalesEditRoute.es6" props="props" />',
      controller: [
        '$scope',
        '$stateParams',
        '$state',
        ($scope, $stateParams, $state) => {
          $scope.props = {
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
          };
        }
      ]
    }
  ]
};
