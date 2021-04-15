import { UserListRoute } from 'features/settings-space-users';
import StateRedirect from '../app/common/StateRedirect';
import * as React from 'react';
import { Route, RouteErrorBoundary, Routes, CustomRouter } from 'core/react-routing';
import { window } from 'core/services/window';

function UsersRouter() {
  const [basename] = window.location.pathname.split('users');

  return (
    <CustomRouter splitter="settings/users">
      <RouteErrorBoundary>
        <Routes basename={basename + 'users'}>
          <Route path="/" element={<UserListRoute />} />
          <Route path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
}

export const usersSettingsState = {
  name: 'users',
  url: '/users{pathname:any}',
  params: {
    navigationState: null,
  },
  component: UsersRouter,
};
