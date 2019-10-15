import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog.es6';
import ExtensionsListRoute from './ExtensionsListRoute.es6';
import ExtensionEditorRoute from './ExtensionEditorRoute.es6';
import createAppsRepo from 'app/settings/AppsBeta/AppsRepo.es6';

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
            extensionLoader: spaceContext.extensionLoader,
            appsRepo: createAppsRepo(spaceContext.extensionDefinitionLoader, spaceContext.endpoint)
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
            extensionLoader: spaceContext.extensionLoader
          };
        }
      ]
    }
  ]
};