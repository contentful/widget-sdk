import { Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import { WebhookListRoute } from './WebhookListRoute';
import { WebhookNewRoute } from './WebhookNewRoute';
import { WebhookEditRoute } from './WebhookEditRoute';
import { WebhookCallRoute } from './WebhookCallRoute';
import StateRedirect from 'app/common/StateRedirect';
import React from 'react';

export const WebhooksRouter = () => (
  <RouteErrorBoundary>
    <Routes>
      <Route name="spaces.detail.settings.webhooks.list" path="/" element={<WebhookListRoute />} />
      <Route name="spaces.detail.settings.webhooks.new" path="/new" element={<WebhookNewRoute />} />
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
);
