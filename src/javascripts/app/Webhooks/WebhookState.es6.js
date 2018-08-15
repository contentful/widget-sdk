import spaceContext from 'spaceContext';
import createResourceService from 'services/ResourceService';
import leaveConfirmator from 'navigation/confirmLeaveEditor';
import TheLocaleStore from 'TheLocaleStore';
import {domain} from 'Config';

const isNonEmptyString = s => typeof s === 'string' && s.length > 0;

function prepareContentTypesForTemplates () {
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
    webhooks: ['spaceContext', spaceContext => spaceContext.webhookRepo.getAll()],
    resource: ['spaceContext', spaceContext => {
      return createResourceService(spaceContext.getId()).get('webhookDefinition');
    }]
  },
  template: '<react-component class="workbench webhook-list" name="app/Webhooks/WebhookList" props="props" />',
  controller: ['$scope', 'webhooks', 'resource', ($scope, webhooks, resource) => {
    const {pricingVersion} = spaceContext.organizationContext.organization;
    $scope.props = {
      webhooks,
      webhookRepo: spaceContext.webhookRepo,
      templateContentTypes: prepareContentTypesForTemplates(),
      resource,
      organization: {pricingVersion}
    };
  }]
};

const call = {
  name: 'call',
  url: '/call/:callId',
  resolve: {
    call: ['spaceContext', 'webhook', '$stateParams', (spaceContext, webhook, $stateParams) => {
      return spaceContext.webhookRepo.logs.getCall(webhook.sys.id, $stateParams.callId);
    }]
  },
  template: '<react-component class="workbench webhook-call" name="app/Webhooks/WebhookCall" props="props" />',
  controller: ['$scope', 'webhook', 'call', ($scope, webhook, call) => {
    $scope.props = {webhook, call};
  }]
};

const editorTemplate = '<react-component class="workbench webhook-editor" name="app/Webhooks/WebhookEditor" props="props" />';

const editorController = ['$scope', 'webhook', ($scope, webhook) => {
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
}];

const detail = {
  name: 'detail',
  url: '/:webhookId',
  resolve: {
    webhook: ['spaceContext', '$stateParams', (spaceContext, $stateParams) => {
      return spaceContext.webhookRepo.get($stateParams.webhookId);
    }]
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
