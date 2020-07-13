import { getModule } from 'core/NgRegistry';
import { get, set } from 'lodash';
import { createCustomWidgetLoader } from './CustomWidgetLoader';
import { getAppsRepo } from 'features/apps-core';
import { WidgetLoader, MarketplaceDataProvider } from 'features/widget-renderer';
import { createPlainClient } from 'contentful-management';

// Both Extension and AppInstallation are environment-level
// entities: we cache loaders per space-environment.
const perSpaceEnvCache = {};
const newPerSpaceEnvCache = {};

export function getCustomWidgetLoader() {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getEnvironmentId();

  let loader = get(perSpaceEnvCache, [spaceId, environmentId]);

  if (!loader) {
    loader = createCustomWidgetLoader(spaceContext.cma, getAppsRepo());
    set(perSpaceEnvCache, [spaceId, environmentId], loader);
  }

  return loader;
}

export function getNewCustomWidgetLoader(accessToken) {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getEnvironmentId();

  let loader = get(newPerSpaceEnvCache, [spaceId, environmentId]);

  if (!loader) {
    const client = createPlainClient({ accessToken });
    const marketplaceDataProvider = new MarketplaceDataProvider(window.fetch, {
      defaultAppIconUrl: 'https://default-app-icon',
      defaultExtensionIconUrl: 'https://default-extension-icon',
      unknownWidgetTypeIconUrl: 'https://unknown-widget-type-icon',
    });

    loader = new WidgetLoader(client, marketplaceDataProvider, spaceId, environmentId);

    set(newPerSpaceEnvCache, [spaceId, environmentId], loader);
  }

  return loader;
}
