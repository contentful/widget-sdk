import { Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import * as React from 'react';
import { ExtensionsListRoute } from './ExtensionsListRoute';
import { ExtensionEditorRoute } from './ExtensionEditorRoute';

export const ExtensionsRouter = () => (
  <RouteErrorBoundary>
    <Routes>
      <Route
        name="spaces.detail.settings.extensions.list"
        path="/"
        element={<ExtensionsListRoute />}
      />
      <Route
        name="spaces.detail.settings.extensions.detail"
        path="/:extensionId"
        element={<ExtensionEditorRoute />}
      />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  </RouteErrorBoundary>
);
