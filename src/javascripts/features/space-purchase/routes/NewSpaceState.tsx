import React from 'react';
import { withOrganizationRoute } from 'states/withOrganizationRoute';
import { SpacePurchaseRoute } from './SpacePurchaseRoute';
import { SpacePurchaseContextProvider } from '../context';
import { CustomRouter, RouteErrorBoundary, Routes, Route } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';

function NewSpaceRoute({ orgId }: { orgId: string }) {
  return (
    <SpacePurchaseContextProvider>
      <SpacePurchaseRoute orgId={orgId} />
    </SpacePurchaseContextProvider>
  );
}

export const newSpaceState = {
  name: 'new_space',
  url: '/new_space{pathname:any}',
  params: {
    navigationState: null,
  },
  component: withOrganizationRoute(function Router({ orgId }: { orgId: string }) {
    const [basename] = window.location.pathname.split('new_space');
    return (
      <CustomRouter splitter={`new_space`}>
        <RouteErrorBoundary>
          <Routes basename={basename + 'new_space'}>
            <Route
              name="account.organizations.subscription_new.new_space"
              path="/"
              element={<NewSpaceRoute orgId={orgId} />}
            />
            <Route name={null} path="*" element={<StateRedirect path="home" />} />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  }),
};
