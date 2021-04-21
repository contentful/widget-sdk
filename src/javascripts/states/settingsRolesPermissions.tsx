import React from 'react';
import { RoleEditorRoute, RolesListRoute } from 'features/roles-permissions-management';
import { CustomRouter, Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from '../app/common/StateRedirect';
import { window } from 'core/services/window';

function RolesPermissionsRoute() {
  const [basename] = window.location.pathname.split('roles');

  return (
    <CustomRouter splitter="settings/roles">
      <RouteErrorBoundary>
        <Routes basename={basename + 'roles'}>
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
    </CustomRouter>
  );
}

export const rolesPermissionsSettingsState = {
  name: 'roles',
  url: '/roles{pathname:any}',
  params: {
    navigationState: null,
  },
  component: RolesPermissionsRoute,
};
