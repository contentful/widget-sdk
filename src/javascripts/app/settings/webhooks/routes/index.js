import React from 'react';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import {
  WebhooksListLoadingSkeleton,
  WebhookLoadingSkeleton,
} from '../skeletons/WebhookListRouteSkeleton';
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

export default {
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
        <LazyLoadedComponent fallback={WebhooksListLoadingSkeleton} importer={SettingsImporter}>
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
        <LazyLoadedComponent fallback={WebhookLoadingSkeleton} importer={SettingsImporter}>
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
        <LazyLoadedComponent fallback={WebhookLoadingSkeleton} importer={SettingsImporter}>
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
            <LazyLoadedComponent fallback={WebhookLoadingSkeleton} importer={SettingsImporter}>
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
