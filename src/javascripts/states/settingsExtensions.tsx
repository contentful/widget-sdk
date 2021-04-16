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
          <Route path="/" element={<ExtensionsListRoute />} />
          <Route path="/:extensionId" element={<ExtensionEditorRoute />} />
          <Route path="*" element={<StateRedirect path="home" />} />
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
