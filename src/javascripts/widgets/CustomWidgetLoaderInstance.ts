import { getModule } from 'core/NgRegistry';
import { get, set } from 'lodash';
import { WidgetLoader, MarketplaceDataProvider } from '@contentful/widget-renderer';
import { createPlainClient } from 'contentful-management';
import { getToken } from 'Authentication';
import * as Config from 'Config';

// Use one icon for all types of widgets.
// TODO: Use separate ones once designed.
const ICON =
  '//images.ctfassets.net/lpjm8d10rkpy/4zI9Kh5oRtahqJockE56KG/9948001e84714b7089a60457891b1722/app-icon.svg';

let marketplaceDataProvider: MarketplaceDataProvider;

export function getMarketplaceDataProvider() {
  if (marketplaceDataProvider) {
    return marketplaceDataProvider;
  }

  marketplaceDataProvider = new MarketplaceDataProvider(window.fetch.bind(window), {
    defaultAppIconUrl: ICON,
    defaultExtensionIconUrl: ICON,
    unknownWidgetTypeIconUrl: ICON,
  });

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
  const environmentId = spaceContext.cma.envId;
  const cachePath = [accessToken, spaceId, environmentId];

  let loader: WidgetLoader = get(cache, cachePath);

  if (!loader) {
    const [proto, host] = Config.apiUrl().split('://');

    const client = createPlainClient({
      accessToken,
      host: host.replace(/\/+$/, ''),
      insecure: proto !== 'https',
    });

    loader = new WidgetLoader(client, getMarketplaceDataProvider(), spaceId, environmentId);

    set(cache, cachePath, loader);
  }

  return loader;
}
