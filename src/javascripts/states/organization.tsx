import React from 'react';
import { CustomRouter, Route, RouteErrorBoundary, router, Routes } from 'core/react-routing';
import * as Analytics from 'analytics/Analytics';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { subscriptionState } from 'features/organization-subscription';
import { teamsState } from 'features/teams';
import { usersState, inviteUsersState } from 'app/OrganizationSettings/Users/UsersState';
import accessToolsState from 'app/OrganizationSettings/AccessToolsState';
import { billingRoutingState } from 'features/organization-billing';
import OrganizationNavBar from 'navigation/OrganizationNavBar';
import { withOrganizationRoute } from 'states/withOrganizationRoute';
import { GatekeeperView } from 'account/GatekeeperView';

import { orgAppsRoute } from 'features/apps';
import * as TokenStore from 'services/TokenStore';
import { isDeveloper, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { isOrganizationOnTrial, trialState } from 'features/trials';
import { usageState } from 'features/organization-usage';
import { organizationSpacesState } from 'features/organization-spaces';

const resolveOrganizationData = [
  '$stateParams',
  ($stateParams) => TokenStore.getOrganization($stateParams.orgId),
];

// Psuedo route to handle which path a user should be redirected to when they click on "Go to Organization" in the account profile page.
export const organizationSettings = {
  name: 'organization_settings',
  url: '/organization_settings',
  params: { orgId: '' },
  onEnter: [
    '$stateParams',
    async ({ orgId }) => {
      const organization = await TokenStore.getOrganization(orgId);

      if (isDeveloper(organization)) {
        router.navigate(
          { path: 'organizations.apps.list', orgId: organization.sys.id },
          { location: 'replace' }
        );
      } else if (isOwnerOrAdmin(organization) || isOrganizationOnTrial(organization)) {
        // the subscription page is available to users of any role when the org is on trial
        const hasNewPricing = !isLegacyOrganization(organization);

        if (!hasNewPricing) {
          router.navigate(
            { path: 'organizations.subscription_v1', orgId: organization.sys.id },
            { location: 'replace' }
          );
        } else {
          router.navigate(
            { path: 'organizations.subscription.overview', orgId: organization.sys.id },
            { location: 'replace' }
          );
        }
      } else {
        // They are a member and the member path should go to organization/teams
        router.navigate(
          { path: 'organizations.teams', orgId: organization.sys.id },
          { location: 'replace' }
        );
      }
    },
  ],
};

export const organization = {
  name: 'organizations',
  url: '/organizations/:orgId',
  abstract: true,
  resolve: {
    organizationData: resolveOrganizationData,
  },
  onEnter: [
    'organizationData',
    (organizationData) => Analytics.trackContextChange(null, organizationData),
  ],
  navComponent: OrganizationNavBar,
  children: [
    usageState,
    usersState,
    inviteUsersState,
    subscriptionState,
    teamsState,
    accessToolsState,
    billingRoutingState,
    trialState,
    organizationSpacesState,
    orgAppsRoute,
    {
      name: 'edit',
      url: '/edit{pathname:any}',
      component: withOrganizationRoute(function ComponentRoute() {
        const [basename] = window.location.pathname.split('edit');
        return (
          <CustomRouter splitter={'edit'}>
            <RouteErrorBoundary>
              <Routes basename={basename + 'edit'}>
                <Route
                  name="account.organizations.edit"
                  path="/*"
                  element={
                    <GatekeeperView
                      title="Organization information"
                      icon={<ProductIcon size="large" icon="OrgInfo" />}
                    />
                  }
                />
              </Routes>
            </RouteErrorBoundary>
          </CustomRouter>
        );
      }),
    },
    {
      name: 'offsitebackup',
      url: '/offsite_backup/edit{pathname:any}',
      component: withOrganizationRoute(function ComponentRoute() {
        const [basename] = window.location.pathname.split('offsite_backup/edit');
        return (
          <CustomRouter splitter={`offsite_backup/edit`}>
            <RouteErrorBoundary>
              <Routes basename={basename + 'offsite_backup/edit'}>
                <Route
                  name="account.organizations.offsitebackup"
                  path="/*"
                  element={<GatekeeperView title="Offsite backup" />}
                />
              </Routes>
            </RouteErrorBoundary>
          </CustomRouter>
        );
      }),
    },

    {
      name: 'subscription',
      url: '/z_subscription{pathname:any}',
      component: withOrganizationRoute(function ComponentRoute() {
        const [basename] = window.location.pathname.split('z_subscription');
        return (
          <CustomRouter splitter={`z_subscription`}>
            <RouteErrorBoundary>
              <Routes basename={basename + 'z_subscription'}>
                <Route
                  name="account.organizations.subscription"
                  path="/*"
                  element={
                    <GatekeeperView
                      title="Subscription"
                      icon={<ProductIcon size="large" icon="Subscription" />}
                    />
                  }
                />
              </Routes>
            </RouteErrorBoundary>
          </CustomRouter>
        );
      }),
    },

    {
      name: 'subscription_billing',
      url: '/subscription{pathname:any}',
      component: withOrganizationRoute(function ComponentRoute() {
        const [basename] = window.location.pathname.split('subscription');
        return (
          <CustomRouter splitter={`subscription`}>
            <RouteErrorBoundary>
              <Routes basename={basename + 'subscription'}>
                <Route
                  name="account.organizations.subscription_billing"
                  path="/*"
                  element={
                    <GatekeeperView
                      title="Subscription"
                      icon={<ProductIcon size="large" icon="Subscription" />}
                    />
                  }
                />
              </Routes>
            </RouteErrorBoundary>
          </CustomRouter>
        );
      }),
    },
  ],
};
