import React, { useEffect, memo } from 'react';

import { CustomRouter, Route, RouteErrorBoundary, Routes, useParams } from 'core/react-routing';
import * as Analytics from 'analytics/Analytics';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { SubscriptionRouter } from 'features/organization-subscription';
import { TeamsRouter } from 'features/teams';
import { UserPageRouter, InviteRouter } from 'app/OrganizationSettings/Users/UsersState';
import { AccessToolsRouter } from 'app/OrganizationSettings/AccessToolsRouter';
import { BillingRouter } from 'features/organization-billing';
import OrganizationNavBar from 'navigation/OrganizationNavBar';
import { withOrganizationRoute } from './withOrganizationRoute';
import { GatekeeperView } from 'account/GatekeeperView';
import { AppContainer } from 'navigation/AppContainer';
import { OrganizationAppsRouter } from 'features/apps';
import * as TokenStore from 'services/TokenStore';
import { StartAppTrialRoute } from 'features/trials';
import { OrganizationUsageRoute } from 'features/organization-usage';
import { NewSpaceRouter, UpgradeSpaceRouter } from 'features/space-purchase';
import StateRedirect from 'app/common/StateRedirect';

const RouterWithOrganizationData = withOrganizationRoute(({ orgId }: { orgId: string }) => {
  return (
    <Routes>
      <Route
        name="account.organizations.usage"
        path="/usage"
        element={<OrganizationUsageRoute orgId={orgId} />}
      />
      <Route
        name="account.organizations.start_trial"
        path="/start_trial"
        element={<StartAppTrialRoute orgId={orgId} />}
      />
      <Route
        name="account.organizations.subscription_billing"
        path="/subscription/billing_address"
        element={
          <GatekeeperView
            title="Subscription"
            icon={<ProductIcon size="large" icon="Subscription" />}
          />
        }
      />
      <Route
        name="account.organizations.subscription"
        path="/z_subscription*"
        element={
          <GatekeeperView
            title="Subscription"
            icon={<ProductIcon size="large" icon="Subscription" />}
          />
        }
      />
      <Route
        name="account.organizations.edit"
        path="/edit*"
        element={
          <GatekeeperView
            title="Organization information"
            icon={<ProductIcon size="large" icon="OrgInfo" />}
          />
        }
      />
      <Route name={null} path="/access_tools*" element={<AccessToolsRouter orgId={orgId} />} />
      <Route name={null} path="/billing*" element={<BillingRouter orgId={orgId} />} />
      <Route name={null} path="/teams*" element={<TeamsRouter orgId={orgId} />} />
      <Route name={null} path="/invite*" element={<InviteRouter orgId={orgId} />} />
      <Route name={null} path="/apps*" element={<OrganizationAppsRouter orgId={orgId} />} />
      <Route name={null} path="/new_space*" element={<NewSpaceRouter orgId={orgId} />} />
      <Route name={null} path="/upgrade_space*" element={<UpgradeSpaceRouter orgId={orgId} />} />
      <Route
        name={null}
        path="/subscription_overview*"
        element={<SubscriptionRouter orgId={orgId} />}
      />
      <Route
        name={null}
        path="/organization_memberships*"
        element={<UserPageRouter orgId={orgId} />}
      />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  );
});

const OrganizationRouter = () => {
  const { orgId } = useParams() as { orgId: string };

  useEffect(() => {
    TokenStore.getOrganization(orgId).then((organization) => {
      Analytics.trackContextChange({ organization, space: null, environment: null });
    });
  }, [orgId]);

  return (
    <AppContainer navigation={<OrganizationNavBar orgId={orgId} />}>
      <RouterWithOrganizationData orgId={orgId} />;
    </AppContainer>
  );
};

export const organizationReactState = {
  name: 'organizations',
  url: '/organizations{pathname:any}',
  params: {
    navigationState: null,
  },
  navComponent: () => null,
  component: memo(function OrganizationsRouter() {
    const [basename] = window.location.pathname.split('organizations');
    return (
      <CustomRouter splitter="organizations">
        <RouteErrorBoundary>
          <Routes basename={basename + 'organizations'}>
            <Route name={null} path="/:orgId*" element={<OrganizationRouter />} />
            <Route name={null} path="*" element={<StateRedirect path="home" />} />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  }),
};
