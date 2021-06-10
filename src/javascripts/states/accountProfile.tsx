import React from 'react';
import { CustomRouter, Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import { ProfileNavigationBar } from 'navigation/ProfileNavigationBar';
import { AppContainer } from 'navigation/AppContainer';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import OrganizationMembershipsRoute from 'app/UserSettings/OrganizationsRoute';

import { UserCMATokensRoute } from 'features/api-keys-management';
import { GatekeeperView } from 'account/GatekeeperView';
import { UserProfilePage } from 'features/user-profile';
import { SpaceMembershipsPage } from 'features/space-memberships';

function AccountProfileRouter() {
  const [basename] = window.location.pathname.split('profile');

  return (
    <CustomRouter splitter="profile">
      <RouteErrorBoundary>
        <AppContainer navigation={<ProfileNavigationBar />}>
          <Routes basename={basename + 'profile'}>
            <Route name="account.profile.user" path="/user" element={<UserProfilePage />} />
            <Route
              name="account.profile.cma_tokens"
              path="/cma_tokens"
              element={<UserCMATokensRoute />}
            />
            <Route
              name="account.profile.space_memberships"
              path="/space_memberships"
              element={<SpaceMembershipsPage />}
            />
            <Route
              name="account.profile.organization_memberships"
              path="/organization_memberships"
              element={<OrganizationMembershipsRoute />}
            />
            <Route
              name="account.profile.access_grants"
              path="/access_grants*"
              element={
                <GatekeeperView
                  title="OAuth tokens"
                  icon={<ProductIcon size="large" icon="Token" />}
                />
              }
            />
            <Route
              name="account.profile.applications"
              path="/developers/applications*"
              element={
                <GatekeeperView
                  title="OAuth applications"
                  icon={<ProductIcon size="large" icon="Oauth" />}
                />
              }
            />
            <Route name={null} path="*" element={<StateRedirect path="home" />} />
          </Routes>
        </AppContainer>
      </RouteErrorBoundary>
    </CustomRouter>
  );
}

const accountProfileState = {
  name: 'profile',
  url: '/profile{pathname:any}',
  navComponent: () => null,
  component: AccountProfileRouter,
};

export default accountProfileState;
