import { window } from 'core/services/window';
import { CustomRouter, Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import * as React from 'react';
import { TeamsRouter } from 'features/space-teams';
import { EnvironmentsRouter } from 'features/environments-settings';
import { SpaceUsageRouter } from 'app/SpaceSettings/Usage/SpaceUsageState';
import { TagsRouter } from 'features/content-tags';
import { EmbargoedAssetsRoute } from 'features/embargoed-assets';
import { SpaceSettingsRoute } from 'features/space-settings';
import { RolesPermissionsRouter } from 'features/roles-permissions-management';
import { WebhooksRouter } from 'features/webhooks';
import { UsersRouter } from 'features/settings-space-users';
import { LocalesRouter } from 'features/locales-management';
import { ContentPreviewRouter } from 'features/content-preview';
import { ExtensionsRouter } from 'features/extensions-management';

export const SettingsRouter = () => {
  const [basename] = window.location.pathname.split('settings');

  return (
    <CustomRouter splitter="settings">
      <RouteErrorBoundary>
        <Routes basename={basename + 'settings'}>
          <Route
            name="spaces.detail.settings.embargoedAssets"
            path="/embargoed-assets"
            element={<EmbargoedAssetsRoute />}
          />
          <Route
            name="spaces.detail.settings.space"
            path="/space"
            element={<SpaceSettingsRoute />}
          />

          <Route name={null} path="/content_preview*" element={<ContentPreviewRouter />} />
          <Route name={null} path="/environments*" element={<EnvironmentsRouter />} />
          <Route name={null} path="/extensions*" element={<ExtensionsRouter />} />
          <Route name={null} path="/locales*" element={<LocalesRouter />} />
          <Route name={null} path="/roles*" element={<RolesPermissionsRouter />} />
          <Route name={null} path="/tags*" element={<TagsRouter />} />
          <Route name={null} path="/teams*" element={<TeamsRouter />} />
          <Route name={null} path="/usage*" element={<SpaceUsageRouter />} />
          <Route name={null} path="/users*" element={<UsersRouter />} />
          <Route name={null} path="/webhooks*" element={<WebhooksRouter />} />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};
