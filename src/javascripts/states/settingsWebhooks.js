import React from 'react';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { WebhookSkeletons } from 'features/webhooks';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { SettingsImporter } from 'app/settings/SettingsImporter';

const mapInjectedToEditorProps = [
  '$scope',
  '$stateParams',
  ($scope, { webhookId }) => {
    return {
      webhookId,
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
];

export const webhooksRouteState = {
  name: 'webhooks',
  url: '/webhooks',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      params: {
        templateId: null,
        referrer: null,
      },
      component: (props) => (
        <LazyLoadedComponent
          fallback={WebhookSkeletons.WebhooksListLoading}
          importer={SettingsImporter}>
          {({ WebhookListRoute }) => {
            return <WebhookListRoute {...props} />;
          }}
        </LazyLoadedComponent>
      ),
      mapInjectedToProps: [
        '$stateParams',
        ($stateParams) => {
          return {
            templateId: $stateParams.templateId || null,
            templateIdReferrer: $stateParams.referrer || null,
          };
        },
      ],
    },
    {
      name: 'new',
      url: '/new',
      component: (props) => (
        <LazyLoadedComponent fallback={WebhookSkeletons.WebhookLoading} importer={SettingsImporter}>
          {({ WebhookNewRoute }) => {
            return <WebhookNewRoute {...props} />;
          }}
        </LazyLoadedComponent>
      ),
      mapInjectedToProps: mapInjectedToEditorProps,
    },
    {
      name: 'detail',
      url: '/:webhookId',
      component: (props) => (
        <LazyLoadedComponent fallback={WebhookSkeletons.WebhookLoading} importer={SettingsImporter}>
          {({ WebhookEditRoute }) => {
            return <WebhookEditRoute {...props} />;
          }}
        </LazyLoadedComponent>
      ),
      mapInjectedToProps: mapInjectedToEditorProps,
      children: [
        {
          name: 'call',
          url: '/call/:callId',
          component: (props) => (
            <LazyLoadedComponent
              fallback={WebhookSkeletons.WebhookLoading}
              importer={SettingsImporter}>
              {({ WebhookCallRoute }) => {
                return <WebhookCallRoute {...props} />;
              }}
            </LazyLoadedComponent>
          ),
          mapInjectedToProps: [
            '$stateParams',
            '$state',
            ({ webhookId, callId }, $state) => {
              return {
                webhookId,
                callId,
                onGoBack: () => {
                  $state.go('^');
                },
              };
            },
          ],
        },
      ],
    },
  ],
};
