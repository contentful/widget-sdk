import React from 'react';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { ContentPreviewListSkeleton } from '../skeletons/ContentPreviewListSkeleton';
import { ContentPreviewFormSkeleton } from '../skeletons/ContentPreviewFormSkeleton';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { SettingsImporter } from 'app/settings/SettingsImporter';

export default {
  name: 'content_preview',
  url: '/content_preview',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: (props) => (
        <LazyLoadedComponent fallback={ContentPreviewListSkeleton} importer={SettingsImporter}>
          {({ ContentPreviewListRoute }) => {
            return <ContentPreviewListRoute {...props} />;
          }}
        </LazyLoadedComponent>
      ),
    },
    {
      name: 'new',
      url: '/new',
      component: (props) => (
        <LazyLoadedComponent fallback={ContentPreviewFormSkeleton} importer={SettingsImporter}>
          {({ ContentPreviewNewRoute }) => {
            return <ContentPreviewNewRoute {...props} />;
          }}
        </LazyLoadedComponent>
      ),
      mapInjectedToProps: [
        '$scope',
        ($scope) => {
          return {
            registerSaveAction: (save) => {
              $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
              $scope.$applyAsync();
            },
            setDirty: (value) => {
              $scope.context.dirty = value;
              $scope.$applyAsync();
            },
          };
        },
      ],
    },
    {
      name: 'detail',
      url: '/:contentPreviewId',
      component: (props) => (
        <LazyLoadedComponent fallback={ContentPreviewFormSkeleton} importer={SettingsImporter}>
          {({ ContentPreviewEditRoute }) => {
            return <ContentPreviewEditRoute {...props} />;
          }}
        </LazyLoadedComponent>
      ),
      mapInjectedToProps: [
        '$scope',
        '$stateParams',
        ($scope, { contentPreviewId }) => {
          return {
            contentPreviewId,
            registerSaveAction: (save) => {
              $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
              $scope.$applyAsync();
            },
            setDirty: (value) => {
              $scope.context.dirty = value;
              $scope.$applyAsync();
            },
          };
        },
      ],
    },
  ],
};
