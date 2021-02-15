import {
  WebhookListRoute,
  WebhookNewRoute,
  WebhookEditRoute,
  WebhookCallRoute,
} from 'features/webhooks';

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
      component: WebhookListRoute,
    },
    {
      name: 'new',
      url: '/new',
      component: WebhookNewRoute,
    },
    {
      name: 'detail',
      url: '/:webhookId',
      component: WebhookEditRoute,
      children: [
        {
          name: 'call',
          url: '/call/:callId',
          component: WebhookCallRoute,
        },
      ],
    },
  ],
};
