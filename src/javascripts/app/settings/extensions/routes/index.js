import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import ExtensionsListRoute from './ExtensionsListRoute';
import ExtensionEditorRoute from './ExtensionEditorRoute';
import { getExtensionLoader } from 'widgets/ExtensionLoaderInstance';

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
        $stateParams => {
          return {
            extensionUrl: decodeURI($stateParams.extensionUrl || ''),
            extensionUrlReferrer: $stateParams.referrer || null,
            extensionLoader: getExtensionLoader()
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
