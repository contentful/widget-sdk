import * as React from 'react';
import StateRedirect from 'app/common/StateRedirect';
import { CustomRouter, RouteErrorBoundary, Routes, Route } from 'core/react-routing';
import { PageExtensionRoute } from './PageExtensionRoute';

export const pageExtensionsState = {
  name: 'pageExtensions',
  url: '/extensions{pathname:any}',
  component: () => {
    const [basename] = window.location.pathname.split('extensions');

    return (
      <CustomRouter splitter={'extensions'}>
        <RouteErrorBoundary>
          <Routes basename={basename + 'extensions'}>
            <Route
              name="spaces.detail.pageExtensions"
              path="/:extensionId/*"
              element={<PageExtensionRoute />}
            />
            <Route name={null} path="*" element={<StateRedirect path="home" />} />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  },
};
