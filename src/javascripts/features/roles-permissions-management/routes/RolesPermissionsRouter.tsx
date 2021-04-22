import { Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import React from 'react';
import { RolesListRoute } from './RolesListRoute';
import { RoleEditorRoute } from './RoleEditorRoute';

export const RolesPermissionsRouter = () => (
  <RouteErrorBoundary>
    <Routes>
      <Route name="spaces.detail.settings.roles.list" path="/" element={<RolesListRoute />} />
      {/* "key" is required to fully unmount the component between "new"/":roleId" route changes */}
      <Route
        name="spaces.detail.settings.roles.new"
        path="/new*"
        element={<RoleEditorRoute isNew={true} key="new" />}
      />
      <Route
        name="spaces.detail.settings.roles.detail"
        path="/:roleId*"
        element={<RoleEditorRoute isNew={false} key="existing" />}
      />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  </RouteErrorBoundary>
);
