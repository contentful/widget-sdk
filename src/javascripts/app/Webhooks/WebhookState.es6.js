import spaceContext from 'spaceContext';
import leaveConfirmator from 'navigation/confirmLeaveEditor';
import TheLocaleStore from 'TheLocaleStore';
import { domain } from 'Config.es6';
import modalDialog from 'modalDialog';
import Templates from './templates';

const validTemplateIds = Templates.map(template => template.id);

const isNonEmptyString = s => typeof s === 'string' && s.length > 0;

export function openTemplateDialog(templateId, webhookRepo, templateContentTypes) {
  if (!validTemplateIds.includes(templateId)) {
    return;
  }
  modalDialog.open({
    ignoreEsc: false,
    backgroundClose: false,
    template:
      '<react-component class="modal-background" name="app/Webhooks/WebhookTemplateDialog.es6" props="props" />',
    controller: $scope => {
      $scope.props = {
        templateId,
        webhookRepo,
        templateContentTypes,
        reposition: () => $scope.$emit('centerOn:reposition'),
        closeDialog: () => $scope.dialog.confirm()
      };
    }
  });
}

function prepareContentTypesForTemplates() {
  const contentTypes = spaceContext.publishedCTs.getAllBare();
  const defaultLocale = TheLocaleStore.getDefaultLocale();

  return contentTypes
    .filter(ct => isNonEmptyString(ct.displayField))
    .map(ct => {
      const displayField = ct.fields.find(f => f.id === ct.displayField);
      return {
        id: ct.sys.id,
        name: ct.name,
        displayFieldId: displayField && displayField.apiName
      };
    })
    .filter(ct => isNonEmptyString(ct.displayFieldId))
    .map(ct => ({
      ...ct,
      titlePointer: `/payload/fields/${ct.displayFieldId}/${defaultLocale.code}`,
      appUrlPointers: `https://app.${domain}/spaces/{ /payload/sys/space/sys/id }/entries/{ /payload/sys/id }`
    }));
}

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
    ($scope, $stateParams, webhooks, isAdmin) => {
      const templateContentTypes = prepareContentTypesForTemplates();
      const webhookRepo = spaceContext.webhookRepo;

      if (isAdmin && $stateParams.templateId) {
        openTemplateDialog($stateParams.templateId, webhookRepo, templateContentTypes);
      }

      $scope.props = {
        webhooks,
        webhookRepo,
        templateContentTypes,
        openTemplateDialog,
        isAdmin,
        templateId: $stateParams.templateId
      };
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
