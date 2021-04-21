import * as React from 'react';
import EnvironmentsRoute from './EnvironmentsRoute';
import StateRedirect from 'app/common/StateRedirect';
import { Route, RouteErrorBoundary, Routes, CustomRouter } from 'core/react-routing';

function EnvironmentsRouter() {
  const [basename] = window.location.pathname.split('settings/environments');

  return (
    <CustomRouter splitter="settings/environments">
      <RouteErrorBoundary>
        <Routes basename={basename + 'settings/environments'}>
          <Route
            name="spaces.detail.settings.environments"
            path="/"
            element={<EnvironmentsRoute />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
}

export default {
  name: 'environments',
  url: '/environments{pathname:any}',
  params: {
    navigationState: null,
  },
  component: EnvironmentsRouter,
};
