import { WidgetNamespace } from './interfaces';
import { NAMESPACE_APP, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';

type FetchFn = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

interface CacheItem {
  slug: string;
  iconUrl?: string;
}

interface Icons {
  defaultAppIconUrl: string;
  defaultExtensionIconUrl: string;
  unknownWidgetTypeIconUrl: string;
}

interface MarketplaceData {
  items: Array<{
    fields: {
      slug: string;
      appDefinitionId: string;
      icon?: {
        sys: {
          id: string;
        };
      };
    };
  }>;
  includes: {
    Asset: Array<{
      sys: {
        id: string;
      };
      fields: {
        file: {
          url?: string;
        };
      };
    }>;
  };
}

const MARKETPLACE_SPACE_ID = 'lpjm8d10rkpy';
const MARKETPLACE_SPACE_API_KEY = 'XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk';
const MARKETPLACE_URL = `https://cdn.contentful.com/spaces/${MARKETPLACE_SPACE_ID}/entries`;
const MARKETPLACE_APP_FIELDS = ['fields.slug', 'fields.appDefinitionId', 'fields.icon'].join(',');
const MARKETPLACE_QUERY = `?content_type=app&include=2&select=${MARKETPLACE_APP_FIELDS}&locale=en=US`;

export class MarketplaceDataProvider {
  private fetch: FetchFn;
  private icons: Icons;
  private cache: Record<string, CacheItem | undefined>;

  constructor(fetch: FetchFn, icons: Icons) {
    this.fetch = fetch;
    this.icons = icons;
    this.cache = {};
  }

  public async prefetch(): Promise<void> {
    if (Object.keys(this.cache).length > 0) {
      return;
    }

    const url = MARKETPLACE_URL + MARKETPLACE_QUERY;
    const Authorization = `Bearer ${MARKETPLACE_SPACE_API_KEY}`;
    const res = await this.fetch(url, { headers: { Authorization } });

    if (!res.ok) {
      return;
    }

    const data: MarketplaceData = await res.json();

    data.items.forEach((app) => {
      const iconAsset = data.includes.Asset.find((asset) => {
        return asset.sys.id === app.fields.icon?.sys.id;
      });

      this.cache[app.fields.appDefinitionId] = {
        slug: app.fields.slug,
        iconUrl: iconAsset?.fields.file.url,
      };
    });
  }

  public getSlug(widgetNamespace: WidgetNamespace, widgetId: string): string {
    if (widgetNamespace === NAMESPACE_APP) {
      return this.cache[widgetId]?.slug || widgetId;
    } else {
      return widgetId;
    }
  }

  public getIconUrl(widgetNamespace: WidgetNamespace, widgetId: string): string {
    if (widgetNamespace === NAMESPACE_EXTENSION) {
      return this.icons.defaultExtensionIconUrl;
    } else if (widgetNamespace === NAMESPACE_APP) {
      return this.cache[widgetId]?.iconUrl || this.icons.defaultAppIconUrl;
    } else {
      return this.icons.unknownWidgetTypeIconUrl;
    }
  }
}
