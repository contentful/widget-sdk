import { Route, Routes } from 'core/react-routing';
import StateRedirect from '../common/StateRedirect';
import React from 'react';
import { SSOSetup } from 'features/sso';
import UserProvisioning from './UserProvisioning/UserProvisioning';

export function AccessToolsRouter({ orgId }: { orgId: string }) {
  return (
    <Routes>
      <Route
        name="account.organizations.access-tools.user-provisioning"
        path="/user_provisioning"
        element={<UserProvisioning orgId={orgId} />}
      />
      <Route
        name="account.organizations.access-tools.sso"
        path="/sso"
        element={<SSOSetup orgId={orgId} />}
      />

      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  );
}
