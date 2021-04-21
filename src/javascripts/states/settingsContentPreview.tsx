import * as React from 'react';
import {
  ContentPreviewListRoute,
  ContentPreviewNewRoute,
  ContentPreviewEditRoute,
} from 'features/content-preview';
import { window } from 'core/services/window';
import { CustomRouter, Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import { withUnsavedChangesDialog } from 'core/hooks';

function ContentPreviewRouter() {
  const [basename] = window.location.pathname.split('content_preview');
  const UnsavedNewRoute = withUnsavedChangesDialog(ContentPreviewNewRoute);
  const UnsavedEditRoute = withUnsavedChangesDialog(ContentPreviewEditRoute);

  return (
    <CustomRouter splitter="settings/content_preview">
      <RouteErrorBoundary>
        <Routes basename={basename + 'content_preview'}>
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
    </CustomRouter>
  );
}

export const contentPreviewState = {
  name: 'content_preview',
  url: '/content_preview{pathname:any}',
  params: {
    navigationState: null,
  },
  component: ContentPreviewRouter,
};
