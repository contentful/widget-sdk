import { WidgetNamespace, Widget, ParameterDefinition, FieldType, Location } from './interfaces';
import { MarketplaceDataProvider } from './marketplace-data-provider';
import { createPlainClient } from 'contentful-management';
import DataLoader, { BatchLoadFn } from 'dataloader';
import { NAMESPACE_EXTENSION, NAMESPACE_APP, NAMESPACE_BUILTIN } from 'widgets/WidgetNamespaces';
import { get, uniqBy, isNil } from 'lodash';

// TODO
// * Actually use it, update downstream consumers

export type ClientAPI = ReturnType<typeof createPlainClient>;

const isWidget = (w: Widget | Error | null): w is Widget => {
  return !isNil(w) && (w as Widget).hosting !== undefined;
};

export interface Extension {
  sys: {
    type: 'Extension';
    id: string;
    srcdocSha256?: string;
  };
  extension: {
    name: string;
    fieldTypes?: FieldType[];
    src?: string;
    srcdoc?: string;
    sidebar?: boolean;
    parameters?: {
      instance?: ParameterDefinition[];
      installation?: ParameterDefinition[];
    };
  };
  parameters?: Record<string, string | number | boolean>;
}

export interface AppDefinition {
  sys: {
    type: 'AppDefinition';
    id: string;
  };
  name: string;
  src?: string;
  locations?: Location[];
}

export interface AppInstallation {
  sys: {
    type: 'AppInstallation';
    appDefinition: {
      sys: {
        type: 'Link';
        linkType: 'AppDefinition';
        id: string;
      };
    };
  };
  parameters?: Record<string, any> | Array<any> | number | string | boolean;
}

interface WidgetRef {
  widgetNamespace: WidgetNamespace;
  widgetId: string;
  // setting
}

interface ControlWidgetRef {
  widgetNamespace?: WidgetNamespace;
  widgetId?: string;
}

export interface EditorInterface {
  sys: {
    type: 'EditorInterface';
    contentType: {
      sys: {
        type: 'Link';
        linkType: 'ContentType';
        id: string;
      };
    };
  };
  controls?: ControlWidgetRef[];
  sidebar?: WidgetRef[];
  editor?: WidgetRef;
  editors?: WidgetRef[];
}

type CacheValue = Widget | null;

const cacheKeyFn = ({ widgetNamespace, widgetId }: WidgetRef): string =>
  [widgetNamespace, widgetId].join(',');

export const buildExtensionWidget = (
  extension: Extension,
  marketplaceDataProvider: MarketplaceDataProvider
): Widget => {
  const locations: Location[] = [
    {
      location: 'entry-field',
      fieldTypes: extension.extension.fieldTypes || [],
    },
    { location: 'page' },
    { location: 'entry-sidebar' },
    { location: 'entry-editor' },
    { location: 'dialog' },
  ];

  if (extension.extension.sidebar) {
    locations.push({ location: 'entry-field-sidebar' });
  }

  return {
    namespace: NAMESPACE_EXTENSION,
    id: extension.sys.id,
    slug: marketplaceDataProvider.getSlug(NAMESPACE_EXTENSION, extension.sys.id),
    iconUrl: marketplaceDataProvider.getIconUrl(NAMESPACE_EXTENSION, extension.sys.id),
    name: extension.extension.name,
    hosting: {
      type: typeof extension.sys.srcdocSha256 === 'string' ? 'srcdoc' : 'src',
      value: extension.extension.src || extension.extension.srcdoc!,
    },
    parameters: {
      definitions: {
        instance: get(extension, ['extension', 'parameters', 'instance'], []),
        installation: get(extension, ['extension', 'parameters', 'installation'], []),
      },
      values: {
        installation: extension.parameters || {},
      },
    },
    locations,
  };
};

export const buildAppWidget = (
  installation: AppInstallation,
  definition: AppDefinition,
  marketplaceDataProvider: MarketplaceDataProvider
): Widget => {
  return {
    namespace: NAMESPACE_APP,
    id: definition.sys.id,
    slug: marketplaceDataProvider.getSlug(NAMESPACE_APP, definition.sys.id),
    iconUrl: marketplaceDataProvider.getIconUrl(NAMESPACE_APP, definition.sys.id),
    name: definition.name,
    hosting: {
      type: 'src',
      value: definition.src!,
    },
    parameters: {
      definitions: {
        instance: [],
        installation: [],
      },
      values: {
        installation:
          typeof installation.parameters === 'undefined' ? {} : installation.parameters!,
      },
    },
    locations: definition.locations || [],
  };
};

export class WidgetLoader {
  private client: ClientAPI;
  private marketplaceDataProvider: MarketplaceDataProvider;
  private baseUrl: string;
  private loader: DataLoader<WidgetRef, CacheValue, string>;

  constructor(
    client: ClientAPI,
    marketplaceDataProvider: MarketplaceDataProvider,
    spaceId: string,
    envId: string
  ) {
    this.client = client;
    this.marketplaceDataProvider = marketplaceDataProvider;
    this.baseUrl = `/spaces/${spaceId}/environments/${envId}`;
    this.loader = new DataLoader(this.load.bind(this), {
      cacheKeyFn,
    });
  }

  private load: BatchLoadFn<WidgetRef, CacheValue> = async (keys) => {
    if (keys.length < 1) {
      return [];
    }

    const emptyExtensionResponse = { items: [] };
    const extensionIds = keys
      .filter(({ widgetNamespace }) => widgetNamespace === NAMESPACE_EXTENSION)
      .map(({ widgetId }) => widgetId);

    const extensionsRes =
      extensionIds.length > 0
        ? this.client.raw.get(`${this.baseUrl}/extensions`, {
          params: {
            'sys.id[in]': extensionIds.join(','),
          },
        })
        : Promise.resolve(emptyExtensionResponse);

    const emptyAppsResponse = { items: [], includes: { AppDefinition: [] } };
    const appRefs = keys.filter(({ widgetNamespace }) => widgetNamespace === NAMESPACE_APP);

    const appInstallationsRes =
      appRefs.length > 0
        ? this.client.raw.get(`${this.baseUrl}/app_installations`)
        : Promise.resolve(emptyAppsResponse);

    const [
      { items: extensions },
      {
        items: installedApps,
        includes: { AppDefinition: usedAppDefinitions },
      },
    ] = await Promise.all([
      extensionsRes.catch(() => emptyExtensionResponse),
      appInstallationsRes.catch(() => emptyAppsResponse),
      this.marketplaceDataProvider.prefetch(),
    ]);

    return keys.map(({ widgetId, widgetNamespace }) => {
      if (widgetNamespace === NAMESPACE_APP) {
        const installation = installedApps.find(
          (app) => get(app, ['sys', 'appDefinition', 'sys', 'id']) === widgetId
        );
        const definition = usedAppDefinitions.find((def) => get(def, ['sys', 'id']) === widgetId);

        if (installation && definition && definition.src) {
          return buildAppWidget(installation, definition, this.marketplaceDataProvider);
        } else {
          return null;
        }
      }

      if (widgetNamespace === NAMESPACE_EXTENSION) {
        const ext = extensions.find((ext) => get(ext, ['sys', 'id']) === widgetId);

        return ext ? buildExtensionWidget(ext, this.marketplaceDataProvider) : null;
      }

      return null;
    });
  };

  public async warmUp(widgetNamespace: WidgetNamespace, widgetId: string): Promise<void> {
    await this.loader.load({ widgetNamespace, widgetId });
  }

  private getControlWidgetRefs(controls: ControlWidgetRef[] = []): WidgetRef[] {
    const isNonEmptyString = (s: any) => typeof s === 'string' && s.length > 0;

    return controls
      .filter((control) => isNonEmptyString(control.widgetId))
      .filter((control) => control.widgetNamespace !== NAMESPACE_BUILTIN)
      .reduce((acc, control) => {
        if (
          control.widgetNamespace === NAMESPACE_APP ||
          control.widgetNamespace === NAMESPACE_EXTENSION
        ) {
          return acc.concat([
            { widgetNamespace: control.widgetNamespace!, widgetId: control.widgetId! },
          ]);
        } else {
          return acc.concat([
            { widgetNamespace: NAMESPACE_APP, widgetId: control.widgetId! },
            { widgetNamespace: NAMESPACE_EXTENSION, widgetId: control.widgetId! },
          ]);
        }
      }, [] as WidgetRef[]);
  }

  private extractWidgetRefsFromEditorInterface(ei: EditorInterface): WidgetRef[] {
    return [
      ...(ei.sidebar || []),
      ...(ei.editor ? [ei.editor] : []),
      ...(ei.editors || []),
      ...this.getControlWidgetRefs(ei.controls),
    ]
      .filter((ref) => [NAMESPACE_APP, NAMESPACE_EXTENSION].includes(ref.widgetNamespace))
      .filter((ref) => ref.widgetId)
      .map(({ widgetNamespace, widgetId }) => ({ widgetNamespace, widgetId }));
  }

  public async warmUpWithEditorInterface(ei: EditorInterface): Promise<void> {
    const keys = this.extractWidgetRefsFromEditorInterface(ei);

    await this.loader.loadMany(keys);
  }

  public getOne(widgetNamespace: WidgetNamespace, widgetId: string): Promise<Widget | null> {
    return this.loader.load({ widgetNamespace, widgetId });
  }

  public getWithEditorInterface(ei: EditorInterface): Promise<Array<Widget>> {
    const keys = this.extractWidgetRefsFromEditorInterface(ei);

    return this.getMultiple(keys);
  }

  public async getMultiple(keys: WidgetRef[]): Promise<Widget[]> {
    const widgets = await this.loader.loadMany(uniqBy(keys, cacheKeyFn));

    return widgets.filter(isWidget);
  }

  public evict(widgetNamespace: WidgetNamespace, widgetId: string): void {
    this.loader.clear({ widgetNamespace, widgetId });
  }

  public purge(): void {
    this.loader.clearAll();
  }
}
