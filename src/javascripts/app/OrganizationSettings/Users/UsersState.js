import React from 'react';
import { withOrganizationRoute } from 'states/withOrganizationRoute';
import { NewUserRoute, UserDetailsRoute, UserListRoute } from 'app/OrganizationSettings';
import { useParams, CustomRouter, RouteErrorBoundary, Routes, Route } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import { getModule } from 'core/NgRegistry';

const WithOrgUserInvite = withOrganizationRoute((props) => <NewUserRoute {...props} />);

const WithOrgUserInviteSpaceDefined = withOrganizationRoute((props) => {
  const { spaceId } = useParams();
  return <NewUserRoute spaceId={spaceId} {...props} />;
});

export const inviteUsersState = {
  name: 'invite',
  url: '/invite{pathname:any}',
  component: () => {
    const { orgId } = getModule('$stateParams');
    const [basename] = window.location.pathname.split('invite');

    return (
      <CustomRouter splitter={'invite'}>
        <RouteErrorBoundary>
          <Routes basename={basename + 'invite'}>
            <Route
              name="account.organizations.users.new"
              path="/"
              element={<WithOrgUserInvite orgId={orgId} />}
            />
            <Route
              name="account.organizations.users.new"
              path="/:spaceId"
              element={<WithOrgUserInviteSpaceDefined orgId={orgId} />}
            />
            <Route name={null} path="*" element={<StateRedirect path="home" />} />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  },
};

const WithOrgUserDetails = withOrganizationRoute((props) => {
  const { userId } = useParams();
  return <UserDetailsRoute userId={userId} {...props} />;
});

const WithOrgUsersList = withOrganizationRoute((props) => <UserListRoute {...props} />);

const UserPageRouter = () => {
  const { orgId } = getModule('$stateParams');
  const [basename] = window.location.pathname.split('organization_memberships');

  return (
    <CustomRouter splitter={'organization_memberships'}>
      <RouteErrorBoundary>
        <Routes basename={basename + 'organization_memberships'}>
          <Route
            name="account.organizations.users.list"
            path="/"
            element={<WithOrgUsersList orgId={orgId} />}
          />
          <Route
            name="account.organizations.users.detail"
            path="/:userId"
            element={<WithOrgUserDetails orgId={orgId} />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

export const usersState = {
  name: 'users',
  url: '/organization_memberships{pathname:any}',
  params: {
    orgId: '',
  },
  component: UserPageRouter,
};
