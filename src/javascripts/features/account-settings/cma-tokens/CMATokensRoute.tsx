import React from 'react';
import { UserCMATokensRoute } from 'features/api-keys-management';
import { CustomRouter, Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';

const CMATokenRouter = () => {
  const [basename] = window.location.pathname.split('cma_tokens');

  return (
    <CustomRouter splitter="profile/cma_tokens">
      <RouteErrorBoundary>
        <Routes basename={basename + 'cma_tokens'}>
          <Route name="account.profile.cma_tokens" path="/" element={<UserCMATokensRoute />} />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

const accountCMATokensRouteState = {
  name: 'cma_tokens',
  url: '/cma_tokens{pathname:any}',
  component: CMATokenRouter,
};

export { accountCMATokensRouteState };
