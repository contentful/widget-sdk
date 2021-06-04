import React from 'react';
import { CustomRouter, Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import { GatekeeperView } from 'account/GatekeeperView';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';

function NewOrganizationRouter() {
  const [basename] = window.location.pathname.split('organizations');

  return (
    <CustomRouter splitter="organizations">
      <RouteErrorBoundary>
        <Routes basename={basename + 'organizations'}>
          <Route
            name="account.new_organization"
            path="/new"
            element={<GatekeeperView title="Create new organization" />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
}

const newOrganizationState = {
  name: 'new_organization',
  url: '/organizations/new',
  navComponent: EmptyNavigationBar,
  component: NewOrganizationRouter,
};

export default newOrganizationState;
