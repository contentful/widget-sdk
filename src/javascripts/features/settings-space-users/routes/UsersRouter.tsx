import { Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import { UserListRoute } from './UserListRoute';
import StateRedirect from 'app/common/StateRedirect';
import * as React from 'react';

export const UsersRouter = () => (
  <RouteErrorBoundary>
    <Routes>
      <Route name="spaces.detail.settings.users.list" path="/" element={<UserListRoute />} />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  </RouteErrorBoundary>
);
