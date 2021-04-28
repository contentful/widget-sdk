import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';
import { CustomRouter, Route, Routes, RouteErrorBoundary } from 'core/react-routing';
import { getModule } from 'core/NgRegistry';
import StateRedirect from '../../common/StateRedirect';

export default {
  name: 'user-provisioning',
  url: '/user_provisioning{pathname:any}',
  component: withOrganizationRoute(function UserProvisioningRouter() {
    const { orgId } = getModule('$stateParams');
    const [basename] = window.location.pathname.split('user_provisioning');
    return (
      <CustomRouter splitter={`user_provisioning`}>
        <RouteErrorBoundary>
          <Routes basename={basename + 'user_provisioning'}>
            <Route
              name="account.organizations.access-tools.user-provisioning"
              path="/"
              element={
                <LazyLoadedComponent importer={importer}>
                  {({ UserProvisioning }) => {
                    return <UserProvisioning orgId={orgId} />;
                  }}
                </LazyLoadedComponent>
              }
            />
            <Route name={null} path="*" element={<StateRedirect path="home" />} />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  }),
};
