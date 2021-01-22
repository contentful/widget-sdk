import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { getSpaceContext } from 'classes/spaceContext';
import { ExtensionsListRoute, ExtensionEditorRoute } from 'features/extensions-management';

export const extensionsSettingsState = {
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
        referrer: null,
      },
      component: ExtensionsListRoute,
      mapInjectedToProps: [
        '$stateParams',
        ($stateParams) => {
          const spaceContext = getSpaceContext();
          return {
            extensionUrl: decodeURI($stateParams.extensionUrl || ''),
            extensionUrlReferrer: $stateParams.referrer || null,
            cma: spaceContext.cma,
          };
        },
      ],
    },
    {
      name: 'detail',
      url: '/:extensionId',
      component: ExtensionEditorRoute,
      mapInjectedToProps: [
        '$scope',
        '$stateParams',
        '$state',
        ($scope, $stateParams, $state) => {
          const spaceContext = getSpaceContext();
          return {
            extensionId: $stateParams.extensionId,
            registerSaveAction: (save) => {
              $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
              $scope.$applyAsync();
            },
            setDirty: (value) => {
              $scope.context.dirty = value;
              $scope.$applyAsync();
            },
            cma: spaceContext.cma,
            goToList: () => {
              $state.go('^.list');
            },
          };
        },
      ],
    },
  ],
};
