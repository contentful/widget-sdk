import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import ExtensionsListRoute from './ExtensionsListRoute';
import ExtensionEditorRoute from './ExtensionEditorRoute';
import createAppsRepo from 'app/settings/AppsBeta/AppsRepo';
import { getAppDefinitionLoader } from 'app/settings/webhooks/services/AppDefinitionLoaderInstance';
import { getExtensionLoader } from 'app/settings/webhooks/services/ExtensionLoader';

export default {
  name: 'extensions',
  url: '/extensions',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      params: {
        // optional extensionUrl param to open GitHubInstaller
        extensionUrl: null,
        referrer: null
      },
      component: ExtensionsListRoute,
      mapInjectedToProps: [
        '$stateParams',
        'spaceContext',
        ($stateParams, spaceContext) => {
          return {
            extensionUrl: decodeURI($stateParams.extensionUrl || ''),
            extensionUrlReferrer: $stateParams.referrer || null,
            extensionLoader: getExtensionLoader(),
            appsRepo: createAppsRepo(getAppDefinitionLoader(), spaceContext.endpoint)
          };
        }
      ]
    },
    {
      name: 'detail',
      url: '/:extensionId',
      component: ExtensionEditorRoute,
      mapInjectedToProps: [
        '$scope',
        '$stateParams',
        'spaceContext',
        '$state',
        ($scope, $stateParams, spaceContext, $state) => {
          return {
            extensionId: $stateParams.extensionId,
            registerSaveAction: save => {
              $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
              $scope.$applyAsync();
            },
            setDirty: value => {
              $scope.context.dirty = value;
              $scope.$applyAsync();
            },
            cma: spaceContext.cma,
            goToList: () => {
              $state.go('^.list');
            },
            extensionLoader: getExtensionLoader()
          };
        }
      ]
    }
  ]
};
