import React from 'react';
import { TeamDetailsRoute } from './TeamDetailsRoute';
import { TeamListRoute } from './TeamListRoute';
import { Route, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';

export function TeamsRouter({ orgId }: { orgId: string }) {
  return (
    <Routes>
      <Route
        name="account.organizations.teams"
        path="/"
        element={<TeamListRoute orgId={orgId} />}
      />
      <Route
        name="account.organizations.teams.detail"
        path="/:teamId"
        element={<TeamDetailsRoute orgId={orgId} />}
      />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  );
}
