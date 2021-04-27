import { withUnsavedChangesDialog } from 'core/hooks';
import { Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import * as React from 'react';
import { LocalesNewRoute } from './LocalesNewRoute';
import { LocalesEditRoute } from './LocalesEditRoute';
import { LocalesListRoute } from './LocalesListRoute';

export const LocalesRouter = () => {
  const UnsavedNewRoute = withUnsavedChangesDialog(LocalesNewRoute);
  const UnsavedEditRoute = withUnsavedChangesDialog(LocalesEditRoute);

  return (
    <RouteErrorBoundary>
      <Routes>
        <Route name="spaces.detail.settings.locales.list" path="/" element={<LocalesListRoute />} />
        <Route
          name="spaces.detail.settings.locales.new"
          path="/new"
          element={<UnsavedNewRoute />}
        />
        <Route
          name="spaces.detail.settings.locales.detail"
          path="/:localeId"
          element={<UnsavedEditRoute />}
        />
        <Route name={null} path="*" element={<StateRedirect path="home" />} />
      </Routes>
    </RouteErrorBoundary>
  );
};
