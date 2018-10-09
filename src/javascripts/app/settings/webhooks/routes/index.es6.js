import leaveConfirmator from 'navigation/confirmLeaveEditor';

const editorContoller = [
  '$scope',
  '$stateParams',
  ($scope, { webhookId }) => {
    $scope.props = {
      webhookId,
      registerSaveAction: save => {
        $scope.context.requestLeaveConfirmation = leaveConfirmator(save);
        $scope.$applyAsync();
      },
      setDirty: value => {
        $scope.context.dirty = value;
        $scope.$applyAsync();
      }
    };
  }
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
        templateId: null
      },
      template:
        '<react-component name="app/settings/webhooks/routes/WebhookListRoute.es6" props="props" />',
      controller: [
        '$scope',
        '$stateParams',
        ($scope, { templateId }) => {
          $scope.props = {
            templateId: templateId || null
          };
        }
      ]
    },
    {
      name: 'new',
      url: '/new',
      template:
        '<react-component name="app/settings/webhooks/routes/WebhookNewRoute.es6" props="props" />',
      controller: editorContoller
    },
    {
      name: 'detail',
      url: '/:webhookId',
      template:
        '<react-component name="app/settings/webhooks/routes/WebhookEditRoute.es6" props="props" />',
      controller: editorContoller,
      children: [
        {
          name: 'call',
          url: '/call/:callId',
          template:
            '<react-component name="app/settings/webhooks/routes/WebhookCallRoute.es6" props="props" />',
          controller: [
            '$scope',
            '$stateParams',
            ($scope, { webhookId, callId }) => {
              $scope.props = {
                webhookId,
                callId
              };
            }
          ]
        }
      ]
    }
  ]
};
