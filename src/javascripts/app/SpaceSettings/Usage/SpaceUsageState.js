import * as React from 'react';
import SpaceUsage from './SpaceUsage';
import StateRedirect from 'app/common/StateRedirect';
import { Route, RouteErrorBoundary, Routes } from 'core/react-routing';

export const SpaceUsageRouter = () => (
  <RouteErrorBoundary>
    <Routes>
      <Route name="spaces.detail.settings.usage" path="/" element={<SpaceUsage />} />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  </RouteErrorBoundary>
);
