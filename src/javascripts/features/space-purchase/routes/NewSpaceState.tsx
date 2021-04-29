import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import { SpacePurchaseRoute } from './SpacePurchaseRoute';
import { SpacePurchaseContextProvider } from '../context';
import { CustomRouter, RouteErrorBoundary, Routes, Route } from 'core/react-routing';
import { getModule } from 'core/NgRegistry';
import StateRedirect from 'app/common/StateRedirect';

export const newSpaceState = {
  name: 'new_space',
  url: '/new_space{pathname:any}',
  params: {
    navigationState: null,
  },
  component: withOrganizationRoute(function NewSpaceRouter() {
    const { orgId } = getModule('$stateParams');
    const [basename] = window.location.pathname.split('new_space');
    return (
      <CustomRouter splitter={`new_space`}>
        <RouteErrorBoundary>
          <Routes basename={basename + 'new_space'}>
            <Route
              name="account.organizations.subscription_new.new_space"
              path="/"
              element={
                <SpacePurchaseContextProvider>
                  <SpacePurchaseRoute orgId={orgId} />
                </SpacePurchaseContextProvider>
              }
            />
            <Route name={null} path="*" element={<StateRedirect path="home" />} />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  }),
};
