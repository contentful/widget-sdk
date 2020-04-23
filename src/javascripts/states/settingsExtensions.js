import React from 'react';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { SettingsImporter } from 'app/settings/SettingsImporter';
import { ExtensionEditorSkeleton } from 'features/extensions-management';
import { ExtensionListSkeleton } from 'features/extensions-management';

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
      component: (props) => (
        <LazyLoadedComponent importer={SettingsImporter} fallback={ExtensionListSkeleton}>
          {({ ExtensionsListRoute }) => <ExtensionsListRoute {...props} />}
        </LazyLoadedComponent>
      ),
      mapInjectedToProps: [
        '$stateParams',
        'spaceContext',
        ($stateParams, spaceContext) => {
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
      component: (props) => (
        <LazyLoadedComponent importer={SettingsImporter} fallback={ExtensionEditorSkeleton}>
          {({ ExtensionEditorRoute }) => <ExtensionEditorRoute {...props} />}
        </LazyLoadedComponent>
      ),
      mapInjectedToProps: [
        '$scope',
        '$stateParams',
        'spaceContext',
        '$state',
        ($scope, $stateParams, spaceContext, $state) => {
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
