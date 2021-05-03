import { getSpaceContext } from 'classes/spaceContext';
import { get, set } from 'lodash';
import {
  WidgetLoader,
  MarketplaceDataProvider,
  WidgetNamespace,
} from '@contentful/widget-renderer';
import { createClient } from 'contentful-management';
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
const cache: {
  [accessToken: string]: { [spaceId: string]: { [aliasOrEnvId: string]: WidgetLoader } };
} = {};

let hasOnWarning = false;

export interface WidgetLoadWarning {
  message: string;
  ids: string[];
  fallbackRes: any;
  err: any;
}

export async function getCustomWidgetLoader(onWarning?: (warning: WidgetLoadWarning) => void) {
  const accessToken = await getToken();
  const spaceContext = getSpaceContext();
  const spaceId = spaceContext.getId();
  const aliasOrEnvId = spaceContext.getAliasId() || spaceContext.getEnvironmentId();
  const cachePath = [accessToken, spaceId, aliasOrEnvId] as const;

  let loader: WidgetLoader = get(cache, cachePath);

  if (!loader || (onWarning && !hasOnWarning)) {
    if (onWarning) {
      hasOnWarning = true;
    }
    const [proto, host] = Config.apiUrl().split('://');

    const client = createClient(
      {
        accessToken,
        host: host.replace(/\/+$/, ''),
        insecure: proto !== 'https',
      },
      { type: 'plain' }
    );

    loader = new WidgetLoader(
      client,
      getMarketplaceDataProvider(),
      spaceId,
      aliasOrEnvId,
      onWarning
    );

    set(cache, cachePath, loader);
  }

  return loader;
}

export function evictCustomAppDefinition(appDefinitionId: string): void {
  getAllCachedLoaders().forEach((loader) =>
    loader.evict({
      widgetNamespace: WidgetNamespace.APP,
      widgetId: appDefinitionId,
    })
  );
}

function getAllCachedLoaders(): WidgetLoader[] {
  return Object.values(cache).flatMap((spaceCache) =>
    Object.values(spaceCache).flatMap((envCache) => Object.values(envCache))
  );
}
