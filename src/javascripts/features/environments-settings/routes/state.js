import * as React from 'react';
import { EnvironmentsRoute } from './EnvironmentsRoute';
import StateRedirect from 'app/common/StateRedirect';
import { Route, RouteErrorBoundary, Routes } from 'core/react-routing';

export const EnvironmentsRouter = () => (
  <RouteErrorBoundary>
    <Routes>
      <Route name="spaces.detail.settings.environments" path="/" element={<EnvironmentsRoute />} />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  </RouteErrorBoundary>
);
