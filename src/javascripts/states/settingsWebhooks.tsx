import React from 'react';
import {
  WebhookListRoute,
  WebhookNewRoute,
  WebhookEditRoute,
  WebhookCallRoute,
} from 'features/webhooks';
import StateRedirect from 'app/common/StateRedirect';
import { RouteErrorBoundary, CustomRouter, Routes, Route } from 'core/react-routing';
import { window } from 'core/services/window';

const WebhooksRouter = () => {
  const [basename] = window.location.pathname.split('webhooks');
  return (
    <CustomRouter splitter="settings/webhooks">
      <RouteErrorBoundary>
        <Routes basename={basename + 'webhooks'}>
          <Route
            name="spaces.detail.settings.webhooks.list"
            path="/"
            element={<WebhookListRoute />}
          />
          <Route
            name="spaces.detail.settings.webhooks.new"
            path="/new"
            element={<WebhookNewRoute />}
          />
          <Route
            name="spaces.detail.settings.webhooks.detail"
            path="/:webhookId"
            element={<WebhookEditRoute />}
          />
          <Route
            name="spaces.detail.settings.webhooks.detail.call"
            path="/:webhookId/call/:callId"
            element={<WebhookCallRoute />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

export const webhooksRouteState = {
  name: 'webhooks',
  params: {
    navigationState: null,
  },
  url: '/webhooks{pathname:any}',
  component: WebhooksRouter,
};
