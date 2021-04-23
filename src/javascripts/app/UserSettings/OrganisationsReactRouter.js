import React from 'react';
import { CustomRouter, RouteErrorBoundary, Route, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import OrganizationMembershipsRoute from 'app/UserSettings/OrganizationsRoute';

export const OrganizationsRouter = () => {
  const [basename] = window.location.pathname.split('organization_memberships');

  return (
    <CustomRouter splitter="/profile/organization_memberships">
      <RouteErrorBoundary>
        <Routes basename={basename + '/organization_memberships'}>
          <Route
            name="account.profile.organization_memberships"
            path="/"
            element={<OrganizationMembershipsRoute />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};
