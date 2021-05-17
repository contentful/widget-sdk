import React from 'react';
import { CustomRouter, Route, RouteErrorBoundary, Routes, useParams } from 'core/react-routing';
import { withOrganizationRoute } from 'states/withOrganizationRoute';
import { SpacePurchaseRoute } from './SpacePurchaseRoute';
import { SpacePurchaseContextProvider } from '../context';
import StateRedirect from 'app/common/StateRedirect';

function UpgradeSpaceRoute({ orgId }: { orgId: string }) {
  const { spaceId } = useParams() as { spaceId: string };
  return (
    <SpacePurchaseContextProvider>
      <SpacePurchaseRoute orgId={orgId} spaceId={spaceId} />
    </SpacePurchaseContextProvider>
  );
}

export const upgradeSpaceState = {
  name: 'upgrade_space',
  url: '/upgrade_space{pathname:any}',
  params: {
    navigationState: null,
  },
  component: withOrganizationRoute(function NewSpaceRouter({ orgId }: { orgId: string }) {
    const [basename] = window.location.pathname.split('upgrade_space');
    return (
      <CustomRouter splitter={`upgrade_space`}>
        <RouteErrorBoundary>
          <Routes basename={basename + 'upgrade_space'}>
            <Route
              name="account.organizations.subscription_new.upgrade_space"
              path="/:spaceId"
              element={<UpgradeSpaceRoute orgId={orgId} />}
            />
            <Route name={null} path="*" element={<StateRedirect path="home" />} />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  }),
};
