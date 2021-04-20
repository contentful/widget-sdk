import * as React from 'react';
import SpaceUsage from './SpaceUsage';
import StateRedirect from 'app/common/StateRedirect';
import { Route, RouteErrorBoundary, Routes, CustomRouter } from 'core/react-routing';

function SpaceUsageRouter() {
  const [basename] = window.location.pathname.split('usage');

  return (
    <CustomRouter splitter="settings/usage">
      <RouteErrorBoundary>
        <Routes basename={basename + 'usage'}>
          <Route path="/" element={<SpaceUsage />} />
          <Route path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
}

export default {
  name: 'usage',
  url: '/usage{pathname:any}',
  params: {
    navigationState: null,
  },
  component: SpaceUsageRouter,
};
