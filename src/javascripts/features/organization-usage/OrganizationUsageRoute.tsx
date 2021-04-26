import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import { CustomRouter, RouteErrorBoundary, Routes, Route } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import { getModule } from 'core/NgRegistry';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { importer } from './importer';

const OrganizationUsagePageWrapper = withOrganizationRoute((props) => (
  <LazyLoadedComponent importer={importer}>
    {({ OrganizationUsagePage }) => {
      return <OrganizationUsagePage {...props} />;
    }}
  </LazyLoadedComponent>
));

const OrganizationUsageRouter = () => {
  const [basename] = window.location.pathname.split('usage');
  const { orgId } = getModule('$stateParams');

  return (
    <CustomRouter splitter={`organizations/${orgId}/usage`}>
      <RouteErrorBoundary>
        <Routes basename={basename + 'usage'}>
          <Route
            name="account.organizations.usage"
            path="/"
            element={<OrganizationUsagePageWrapper orgId={orgId} />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

export const usageState = {
  name: 'usage',
  url: '/usage{pathname:any}',
  component: OrganizationUsageRouter,
};
