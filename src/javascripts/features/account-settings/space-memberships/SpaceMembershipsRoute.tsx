import React from 'react';
import { SpaceMembershipsPage } from 'features/space-memberships';
import { CustomRouter, Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';

const SpaceMembershipRoute = () => {
  const [baseline] = window.location.pathname.split('space_memberships');

  return (
    <CustomRouter splitter="profile/space_memberships">
      <RouteErrorBoundary>
        <Routes basename={baseline + 'space_memberships'}>
          <Route
            name="account.profile.space_memberships"
            path="/"
            element={<SpaceMembershipsPage />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

const spaceMembershipsRouteState = {
  name: 'space_memberships',
  url: '/space_memberships{pathname:any}',
  component: SpaceMembershipRoute,
};

export { spaceMembershipsRouteState };
