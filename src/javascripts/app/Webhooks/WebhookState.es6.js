import {omit} from 'lodash';
import spaceContext from 'spaceContext';
import createResourceService from 'services/ResourceService';

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
  template: JST['webhook_call'](), // eslint-disable-line no-undef
  controller: ['$scope', 'webhook', 'call', ($scope, webhook, call) => {
    $scope.webhook = webhook;
    $scope.call = call;

    try {
      $scope.body = JSON.parse(call.request.body);
      call.request = omit($scope.call.request, ['body']);
    } catch (e) { /* ignore */ } // eslint-disable-line no-empty
  }]
};

const detail = {
  name: 'detail',
  url: '/:webhookId',
  resolve: {
    webhook: ['spaceContext', '$stateParams', (spaceContext, $stateParams) => {
      return spaceContext.webhookRepo.get($stateParams.webhookId);
    }]
  },
  template: '<cf-webhook-editor cf-ui-tab class="workbench webhook-editor" />',
  controller: ['$scope', 'webhook', ($scope, webhook) => {
    $scope.context.isNew = false;
    $scope.webhook = webhook;
  }],
  children: [call]
};

const fresh = {
  name: 'new',
  url: '/new',
  template: '<cf-webhook-editor cf-ui-tab class="workbench webhook-editor" />',
  controller: ['$scope', $scope => {
    $scope.context.isNew = true;
    $scope.webhook = { headers: [], topics: ['*.*'] };
  }]
};

export default {
  name: 'webhooks',
  url: '/webhooks',
  abstract: true,
  children: [list, fresh, detail]
};
