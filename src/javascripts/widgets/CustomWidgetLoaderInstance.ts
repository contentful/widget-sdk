import { getModule } from 'core/NgRegistry';
import { get, set } from 'lodash';
import { WidgetLoader, MarketplaceDataProvider } from 'features/widget-renderer';
import { createPlainClient } from 'contentful-management';
import { getToken } from 'Authentication';

const marketplaceDataProvider = new MarketplaceDataProvider(window.fetch.bind(window), {
  defaultAppIconUrl: 'https://default-app-icon',
  defaultExtensionIconUrl: 'https://default-extension-icon',
  unknownWidgetTypeIconUrl: 'https://unknown-widget-type-icon',
});

export function getMarketplaceDataProvider() {
  return marketplaceDataProvider;
}

// Both Extension and AppInstallation are environment-level
// entities. The loader uses the SDK with the current token.
// Hence we cache loaders per token/space-environment combination.
const cache = {};

export async function getCustomWidgetLoader() {
  const accessToken = await getToken();
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getEnvironmentId();
  const cachePath = [accessToken, spaceId, environmentId];

  let loader: WidgetLoader = get(cache, cachePath);

  if (!loader) {
    const client = createPlainClient({ accessToken });

    loader = new WidgetLoader(client, marketplaceDataProvider, spaceId, environmentId);

    set(cache, cachePath, loader);
  }

  return loader;
}
