import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog.es6';
import ExtensionsListRoute from './ExtensionsListRoute.es6';
import ExtensionEditorRoute from './ExtensionEditorRoute.es6';

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
            cma: spaceContext.cma
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
        ($scope, $stateParams, spaceContext) => {
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
            cma: spaceContext.cma
          };
        }
      ]
    }
  ]
};
