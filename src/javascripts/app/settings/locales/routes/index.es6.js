import _ from 'lodash';
import * as ChangeSpaceService from 'services/ChangeSpaceService.es6';
import * as Enforcements from 'access_control/Enforcements.es6';
import { getModule } from 'NgRegistry.es6';

const leaveConfirmator = getModule('navigation/confirmLeaveEditor');

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
        $scope => {
          $scope.props = {
            registerSaveAction: save => {
              $scope.context.requestLeaveConfirmation = leaveConfirmator(save);
              $scope.$applyAsync();
            },
            setDirty: value => {
              $scope.context.dirty = value;
              $scope.$applyAsync();
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
        ($scope, $stateParams) => {
          $scope.props = {
            localeId: $stateParams.localeId,
            registerSaveAction: save => {
              $scope.context.requestLeaveConfirmation = leaveConfirmator(save);
              $scope.$applyAsync();
            },
            setDirty: value => {
              $scope.context.dirty = value;
              $scope.$applyAsync();
            }
          };
        }
      ]
    }
  ]
};
