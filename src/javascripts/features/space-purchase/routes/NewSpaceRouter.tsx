import React from 'react';
import { SpacePurchaseRoute } from './SpacePurchaseRoute';
import { SpacePurchaseContextProvider } from '../context';
import { Routes, Route } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';

function NewSpaceRoute({ orgId }: { orgId: string }) {
  return (
    <SpacePurchaseContextProvider>
      <SpacePurchaseRoute orgId={orgId} />
    </SpacePurchaseContextProvider>
  );
}

export const NewSpaceRouter = ({ orgId }: { orgId: string }) => {
  return (
    <Routes>
      <Route
        name="account.organizations.subscription_new.new_space"
        path="/"
        element={<NewSpaceRoute orgId={orgId} />}
      />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  );
};
