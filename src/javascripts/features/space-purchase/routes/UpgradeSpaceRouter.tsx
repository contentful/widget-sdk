import React from 'react';
import { Route, Routes, useParams } from 'core/react-routing';
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

export const UpgradeSpaceRouter = ({ orgId }: { orgId: string }) => {
  return (
    <Routes>
      <Route
        name="account.organizations.subscription_new.upgrade_space"
        path="/:spaceId"
        element={<UpgradeSpaceRoute orgId={orgId} />}
      />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  );
};
