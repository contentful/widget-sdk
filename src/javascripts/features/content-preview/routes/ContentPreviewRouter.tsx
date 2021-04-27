import { withUnsavedChangesDialog } from 'core/hooks';
import { ContentPreviewNewRoute } from './ContentPreviewNewRoute';
import { ContentPreviewEditRoute } from './ContentPreviewEditRoute';
import { Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import { ContentPreviewListRoute } from './ContentPreviewListRoute';
import StateRedirect from 'app/common/StateRedirect';
import * as React from 'react';

export function ContentPreviewRouter() {
  const UnsavedNewRoute = withUnsavedChangesDialog(ContentPreviewNewRoute);
  const UnsavedEditRoute = withUnsavedChangesDialog(ContentPreviewEditRoute);

  return (
    <RouteErrorBoundary>
      <Routes>
        <Route
          name="spaces.detail.settings.content_preview.list"
          path="/"
          element={<ContentPreviewListRoute />}
        />
        <Route
          name="spaces.detail.settings.content_preview.new"
          path="/new"
          element={<UnsavedNewRoute />}
        />
        <Route
          name="spaces.detail.settings.content_preview.detail"
          path="/:contentPreviewId"
          element={<UnsavedEditRoute />}
        />
        <Route name={null} path="*" element={<StateRedirect path="home" />} />
      </Routes>
    </RouteErrorBoundary>
  );
}
