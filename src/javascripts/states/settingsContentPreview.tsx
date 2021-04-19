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
          <Route path="/" element={<ContentPreviewListRoute />} />
          <Route path="/new" element={<UnsavedNewRoute />} />
          <Route path="/:contentPreviewId" element={<UnsavedEditRoute />} />
          <Route path="*" element={<StateRedirect path="home" />} />
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
