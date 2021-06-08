import React from 'react';
import { Route, Routes } from 'core/react-routing';
import { SpacePlanAssignmentRoute } from 'features/space-plan-assignment';
import { SpaceCreationRoute, SpaceCreationContextProvider } from 'features/space-creation';
import { SubscriptionPageRoute } from './SubscriptionPageRoute';
import StateRedirect from 'app/common/StateRedirect';

import { OrgSubscriptionContextProvider } from '../context';

export const SubscriptionRouter = ({ orgId }: { orgId: string }) => {
  return (
    <Routes>
      <Route
        name="account.organizations.subscription_new.overview"
        path="/"
        element={
          <OrgSubscriptionContextProvider>
            <SubscriptionPageRoute orgId={orgId} />
          </OrgSubscriptionContextProvider>
        }
      />
      <Route
        name="account.organizations.subscription_new.overview.space_create"
        path="/space_create"
        element={
          <SpaceCreationContextProvider>
            <SpaceCreationRoute orgId={orgId} />
          </SpaceCreationContextProvider>
        }
      />
      <Route
        name="account.organizations.subscription_new.overview.space_plans"
        path="/space_plans"
        element={<SpacePlanAssignmentRoute orgId={orgId} />}
      />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  );
};
