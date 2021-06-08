import React from 'react';
import { NewUserRoute, UserDetailsRoute, UserListRoute } from 'app/OrganizationSettings';
import { useParams, Routes, Route } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';

const WithOrgUserInviteSpaceDefined = (props) => {
  const { spaceId } = useParams();
  return <NewUserRoute spaceId={spaceId} {...props} />;
};

export const InviteRouter = ({ orgId }: { orgId: string }) => {
  return (
    <Routes>
      <Route
        name="account.organizations.users.new"
        path="/"
        element={<NewUserRoute orgId={orgId} />}
      />
      <Route
        name="account.organizations.users.new"
        path="/:spaceId"
        element={<WithOrgUserInviteSpaceDefined orgId={orgId} />}
      />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  );
};

const WithOrgUserDetails = (props) => {
  const { userId } = useParams();
  return <UserDetailsRoute userId={userId} {...props} />;
};

export const UserPageRouter = ({ orgId }: { orgId: string }) => {
  return (
    <Routes>
      <Route
        name="account.organizations.users.list"
        path="/"
        element={<UserListRoute orgId={orgId} />}
      />
      <Route
        name="account.organizations.users.detail"
        path="/:userId"
        element={<WithOrgUserDetails orgId={orgId} />}
      />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  );
};
