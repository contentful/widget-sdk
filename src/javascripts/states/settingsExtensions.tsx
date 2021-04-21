import * as React from 'react';
import StateRedirect from 'app/common/StateRedirect';
import { RouteErrorBoundary, CustomRouter, Routes, Route } from 'core/react-routing';
import { window } from 'core/services/window';

import { ExtensionsListRoute, ExtensionEditorRoute } from 'features/extensions-management';

const ExtensionsRouter = () => {
  const [basename] = window.location.pathname.split('extensions');
  return (
    <CustomRouter splitter="settings/extensions">
      <RouteErrorBoundary>
        <Routes basename={basename + 'extensions'}>
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
    </CustomRouter>
  );
};

export const extensionsSettingsState = {
  name: 'extensions',
  params: {
    navigationState: null,
  },
  url: '/extensions{pathname:any}',
  component: ExtensionsRouter,
};
