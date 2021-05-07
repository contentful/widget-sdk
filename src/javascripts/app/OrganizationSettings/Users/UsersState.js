import React from 'react';
import { withOrganizationRoute } from 'states/withOrganizationRoute';
import { NewUserRoute, UserDetailsRoute, UserListRoute } from 'app/OrganizationSettings';
import { CustomRouter, RouteErrorBoundary, Routes, Route } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import { getModule } from 'core/NgRegistry';

const WithOrgUserInvite = withOrganizationRoute((props) => <NewUserRoute {...props} />);

export const inviteUsersState = {
  name: 'new',
  url: '/invite{pathname:any}',
  component: () => {
    const [basename] = window.location.pathname.split('invite');
    const { orgId } = getModule('$stateParams');

    return (
      <CustomRouter splitter={'invite'}>
        <RouteErrorBoundary>
          <Routes basename={basename + 'invite'}>
            <Route
              name="account.organizations.users.new"
              path="/"
              element={<WithOrgUserInvite orgId={orgId} />}
            />
            <Route name={null} path="*" element={<StateRedirect path="home" />} />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  },
};

export const userDetailState = {
  name: 'detail',
  params: {
    userId: '',
  },
  url: '/organization_memberships/:userId',
  component: withOrganizationRoute((props) => <UserDetailsRoute {...props} />),
};

const WithOrgUsersList = withOrganizationRoute((props) => <UserListRoute {...props} />);

export const usersListState = {
  name: 'list',
  url: '/organization_memberships{pathname:any}',
  component: () => {
    const [basename] = window.location.pathname.split('organization_memberships');
    const { orgId } = getModule('$stateParams');

    return (
      <CustomRouter splitter={'organization_memberships'}>
        <RouteErrorBoundary>
          <Routes basename={basename + 'organization_memberships'}>
            <Route
              name="account.organizations.users.list"
              path="/"
              element={<WithOrgUsersList orgId={orgId} />}
            />
            <Route name={null} path="*" element={<StateRedirect path="home" />} />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  },
};
