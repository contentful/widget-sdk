import React from 'react';
import { get } from 'lodash';

import spaceContext from 'spaceContext';
import leaveConfirmator from 'navigation/confirmLeaveEditor';
import TheLocaleStore from 'TheLocaleStore';
import { domain } from 'Config.es6';

import WebhookForbiddenPage from './WebhookForbiddenPage.es6';
import createWebhookTemplateDialogOpener from './createWebhookTemplateDialogOpener.es6';

const list = {
  name: 'list',
  url: '',
  resolve: {
    isAdmin: [
      'spaceContext',
      spaceContext => !!spaceContext.getData('spaceMembership.admin', false)
    ],
    webhooks: [
      'spaceContext',
      'isAdmin',
      (spaceContext, isAdmin) => (isAdmin ? spaceContext.webhookRepo.getAll() : Promise.resolve([]))
    ]
  },
  params: {
    // optional templateId param to open webhook template
    templateId: null
  },
  template:
    '<react-component class="workbench webhook-list" name="app/Webhooks/WebhookList.es6" props="props" />',
  controller: [
    '$scope',
    '$stateParams',
    'webhooks',
    'isAdmin',
    ($scope, { templateId }, webhooks, isAdmin) => {
      const { webhookRepo } = spaceContext;

      const openTemplateDialog = createWebhookTemplateDialogOpener({
        webhookRepo,
        contentTypes: spaceContext.publishedCTs.getAllBare(),
        defaultLocaleCode: get(TheLocaleStore.getDefaultLocale(), ['code'], 'en-US'),
        domain
      });

      const forbidden = !isAdmin && <WebhookForbiddenPage templateId={templateId} />;

      $scope.props = { webhooks, webhookRepo, openTemplateDialog, forbidden };

      if (isAdmin && templateId) {
        openTemplateDialog(templateId);
      }
    }
  ]
};

const call = {
  name: 'call',
  url: '/call/:callId',
  resolve: {
    call: [
      'spaceContext',
      'webhook',
      '$stateParams',
      (spaceContext, webhook, $stateParams) => {
        return spaceContext.webhookRepo.logs.getCall(webhook.sys.id, $stateParams.callId);
      }
    ]
  },
  template:
    '<react-component class="workbench webhook-call" name="app/Webhooks/WebhookCall.es6" props="props" />',
  controller: [
    '$scope',
    'webhook',
    'call',
    ($scope, webhook, call) => {
      $scope.props = { webhook, call };
    }
  ]
};

const editorTemplate =
  '<react-component class="workbench webhook-editor" name="app/Webhooks/WebhookEditor.es6" props="props" />';

const editorController = [
  '$scope',
  'webhook',
  ($scope, webhook) => {
    $scope.props = {
      initialWebhook: webhook,
      webhookRepo: spaceContext.webhookRepo,
      registerSaveAction: save => {
        $scope.context.requestLeaveConfirmation = leaveConfirmator(save);
        $scope.$applyAsync();
      },
      setDirty: value => {
        $scope.context.dirty = value;
        $scope.$applyAsync();
      },
      onChange: changedWebhook => {
        Object.assign(webhook, changedWebhook);
        $scope.$applyAsync();
      }
    };
  }
];

const detail = {
  name: 'detail',
  url: '/:webhookId',
  resolve: {
    webhook: [
      'spaceContext',
      '$stateParams',
      (spaceContext, $stateParams) => {
        return spaceContext.webhookRepo.get($stateParams.webhookId);
      }
    ]
  },
  template: editorTemplate,
  controller: editorController,
  children: [call]
};

const fresh = {
  name: 'new',
  url: '/new',
  resolve: {
    webhook: () => ({ headers: [], topics: ['*.*'] })
  },
  template: editorTemplate,
  controller: editorController
};

export default {
  name: 'webhooks',
  url: '/webhooks',
  abstract: true,
  children: [list, fresh, detail]
};
