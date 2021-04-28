import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';
import { CustomRouter, RouteErrorBoundary, Routes, Route } from 'core/react-routing';
import { getModule } from 'core/NgRegistry';
import StateRedirect from 'app/common/StateRedirect';

const LazySSOSetupPage = withOrganizationRoute((props) => (
  <LazyLoadedComponent importer={importer}>
    {({ SSOSetup }) => {
      return <SSOSetup {...props} />;
    }}
  </LazyLoadedComponent>
));

const SSOSetupRouter = () => {
  const { orgId } = getModule('$stateParams');
  const [basename] = window.location.pathname.split('sso');

  return (
    <CustomRouter splitter="sso">
      <RouteErrorBoundary>
        <Routes basename={basename + 'sso'}>
          <Route
            name="account.organizations.access-tools.sso"
            path="/"
            element={<LazySSOSetupPage orgId={orgId} />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

const ssoSetupState = {
  name: 'sso',
  url: '/sso{pathname:any}',
  component: SSOSetupRouter,
};

export { ssoSetupState };
