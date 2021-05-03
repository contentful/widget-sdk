import { CustomRouter, Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from '../common/StateRedirect';
import React from 'react';
import { SSOSetup } from 'features/sso';
import { withOrganizationRoute } from '../../states/utils';
import UserProvisioning from './UserProvisioning/UserProvisioning';

function AccessToolsRouter(props) {
  const [basename] = window.location.pathname.split('access_tools');

  return (
    <CustomRouter splitter="access_tools">
      <RouteErrorBoundary>
        <Routes basename={basename + 'access_tools'}>
          <Route
            name="account.organizations.access-tools.user-provisioning"
            path="/user_provisioning"
            element={<UserProvisioning orgId={props.orgId} />}
          />
          <Route
            name="account.organizations.access-tools.sso"
            path="/sso"
            element={<SSOSetup orgId={props.orgId} />}
          />

          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
}

export default {
  name: 'access-tools',
  url: '/access_tools{pathname:any}',
  params: {
    navigationState: null,
  },
  component: withOrganizationRoute(AccessToolsRouter),
};
