import React from 'react';
import { CustomRouter, Route, RouteErrorBoundary, Routes } from 'core/react-routing';

import ProfileNavigationBar from 'navigation/ProfileNavigationBar';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { OrganizationsRouter } from 'app/UserSettings/OrganisationsReactRouter';

import { GatekeeperView } from 'account/GatekeeperView';
import { userProfileState } from 'features/user-profile';
import { accountCMATokensRouteState, spaceMembershipsRouteState } from 'features/account-settings';

const organizationMemberships = {
  name: 'organization_memberships',
  url: '/organization_memberships{pathname:any}',
  params: {
    navigationState: null,
  },
  component: OrganizationsRouter,
};

/**
 *
 * Gatekeeper views
 */

const accessGrants = {
  name: 'access_grants',
  url: '/access_grants{pathname:any}',
  component: function OAuthTokensRouter() {
    const [basename] = window.location.pathname.split('access_grants');
    return (
      <CustomRouter splitter="profile/access_grants">
        <RouteErrorBoundary>
          <Routes basename={basename + 'access_grants'}>
            <Route
              name="account.profile.access_grants"
              path="/*"
              element={
                <GatekeeperView
                  title="OAuth tokens"
                  icon={<ProductIcon size="large" icon="Token" />}
                />
              }
            />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  },
};

const applications = {
  name: 'applications',
  url: '/developers/applications{pathname:any}',
  component: function OAuthApplicationsRouter() {
    const [basename] = window.location.pathname.split('developers/applications');
    return (
      <CustomRouter splitter="profile/developers/applications">
        <RouteErrorBoundary>
          <Routes basename={basename + 'developers/applications'}>
            <Route
              name="account.profile.applications"
              path="/*"
              element={
                <GatekeeperView
                  title="OAuth applications"
                  icon={<ProductIcon size="large" icon="Oauth" />}
                />
              }
            />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  },
};

export default {
  name: 'profile',
  url: '/profile',
  abstract: true,
  navComponent: ProfileNavigationBar,
  children: [
    userProfileState,
    accountCMATokensRouteState,
    spaceMembershipsRouteState,
    organizationMemberships,
    accessGrants,
    applications,
  ],
};
