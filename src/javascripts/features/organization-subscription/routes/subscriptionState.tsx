import React from 'react';
import { CustomRouter, Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import { withOrganizationRoute } from 'states/withOrganizationRoute';
import { SpacePlanAssignmentRoute } from 'features/space-plan-assignment';
import { SpaceCreationRoute, SpaceCreationContextProvider } from 'features/space-creation';
import { newSpaceState, upgradeSpaceState } from 'features/space-purchase';
import { SubscriptionPageRoute } from './SubscriptionPageRoute';
import StateRedirect from 'app/common/StateRedirect';

import { OrgSubscriptionContextProvider } from '../context';

const subscriptionPageState = {
  name: 'overview',
  url: '/subscription_overview{pathname:any}',
  params: {
    navigationState: null,
  },
  component: withOrganizationRoute(({ orgId }: { orgId: string }) => {
    const [basename] = window.location.pathname.split('subscription_overview');
    return (
      <CustomRouter splitter="subscription_overview">
        <RouteErrorBoundary>
          <Routes basename={basename + 'subscription_overview'}>
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
        </RouteErrorBoundary>
      </CustomRouter>
    );
  }),
};

export const subscriptionState = {
  name: 'subscription_new',
  url: '',
  abstract: true,
  children: [newSpaceState, upgradeSpaceState, subscriptionPageState],
};
