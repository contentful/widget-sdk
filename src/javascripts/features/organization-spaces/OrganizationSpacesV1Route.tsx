import StateRedirect from 'app/common/StateRedirect';
import { getModule } from 'core/NgRegistry';
import { CustomRouter, RouteErrorBoundary, Routes, Route } from 'core/react-routing';
import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import { OrganizationSpacesV1Page } from './OrganizationSpacesV1Page';

const OrganizationSpacesV1Route = withOrganizationRoute((props) => (
  <OrganizationSpacesV1Page {...props} />
));

const OrganizationSpacesV1Router = () => {
  const [basename] = window.location.pathname.split('spaces');
  const { orgId } = getModule('$stateParams');

  return (
    <CustomRouter splitter={'spaces'}>
      <RouteErrorBoundary>
        <Routes basename={basename + 'spaces'}>
          <Route
            name="account.organizations.spaces"
            path="/"
            element={<OrganizationSpacesV1Route orgId={orgId} />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

export const organizationSpacesState = {
  name: 'spaces',
  url: '/spaces{pathname:any}',
  component: OrganizationSpacesV1Router,
};
