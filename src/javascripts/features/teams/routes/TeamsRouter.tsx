import React from 'react';
import { withOrganizationRoute } from 'states/withOrganizationRoute';
import { TeamDetailsRoute } from './TeamDetailsRoute';
import { TeamListRoute } from './TeamListRoute';
import { CustomRouter, Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import { getModule } from 'core/NgRegistry';

function TeamsRouter() {
  const [basename] = window.location.pathname.split('teams');
  const { orgId } = getModule('$stateParams');

  return (
    <CustomRouter splitter="teams">
      <RouteErrorBoundary>
        <Routes basename={basename + 'teams'}>
          <Route
            name="account.organizations.teams.detail"
            path="/:teamId"
            element={<TeamDetailsRoute orgId={orgId} />}
          />
          <Route
            name="account.organizations.teams"
            path="/"
            element={<TeamListRoute orgId={orgId} />}
          />

          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
}

export const teamsState = {
  name: 'teams',
  url: '/teams{pathname:any}',
  params: {
    navigationState: null,
  },
  component: withOrganizationRoute(TeamsRouter),
};
