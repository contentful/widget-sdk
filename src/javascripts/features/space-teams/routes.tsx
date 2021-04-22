import React from 'react';
import { Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import { AddTeamsPage, SpaceTeamsListPage } from '.';
import StateRedirect from 'app/common/StateRedirect';

export const TeamsRouter = () => (
  <RouteErrorBoundary>
    <Routes>
      <Route name="spaces.detail.settings.teams.list" path="/" element={<SpaceTeamsListPage />} />
      <Route name="spaces.detail.settings.teams.add" path="/add" element={<AddTeamsPage />} />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  </RouteErrorBoundary>
);
