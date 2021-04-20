import React from 'react';
import { window } from 'core/services/window';
import { Route, CustomRouter, Routes, RouteErrorBoundary } from 'core/react-routing';
import { AddTeamsPage, SpaceTeamsListPage } from '.';
import StateRedirect from 'app/common/StateRedirect';

const TeamsRouter = () => {
  const [basename] = window.location.pathname.split('teams');
  const routesBaseName = `${basename}teams`;

  return (
    <CustomRouter splitter="settings/teams">
      <RouteErrorBoundary>
        <Routes basename={routesBaseName}>
          <Route path="/" element={<SpaceTeamsListPage />} />
          <Route path="/add" element={<AddTeamsPage />} />
          <Route path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

const teamsSettingsState = {
  name: 'teams',
  url: '/teams{pathname:any}',
  component: TeamsRouter,
};

export { teamsSettingsState };
