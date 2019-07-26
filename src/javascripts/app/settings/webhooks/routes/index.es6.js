import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog.es6';
import WebhookListRoute from './WebhookListRoute.es6';
import WebhookNewRoute from './WebhookNewRoute.es6';
import WebhookEditRoute from './WebhookEditRoute.es6';
import WebhookCallRoute from './WebhookCallRoute.es6';

const mapInjectedToEditorProps = [
  '$scope',
  '$stateParams',
  'spaceContext',
  ($scope, { webhookId }, { webhookRepo }) => {
    return {
      webhookId,
      webhookRepo,
      registerSaveAction: save => {
        $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
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
        templateId: null,
        referrer: null
      },
      component: WebhookListRoute,
      mapInjectedToProps: [
        '$stateParams',
        $stateParams => {
          return {
            templateId: $stateParams.templateId || null,
            templateIdReferrer: $stateParams.referrer || null
          };
        }
      ]
    },
    {
      name: 'new',
      url: '/new',
      component: WebhookNewRoute,
      mapInjectedToProps: mapInjectedToEditorProps
    },
    {
      name: 'detail',
      url: '/:webhookId',
      component: WebhookEditRoute,
      mapInjectedToProps: mapInjectedToEditorProps,
      children: [
        {
          name: 'call',
          url: '/call/:callId',
          component: WebhookCallRoute,
          mapInjectedToProps: [
            '$stateParams',
            'spaceContext',
            '$state',
            ({ webhookId, callId }, { webhookRepo }, $state) => {
              return {
                webhookRepo,
                webhookId,
                callId,
                onGoBack: () => {
                  $state.go('^');
                }
              };
            }
          ]
        }
      ]
    }
  ]
};
