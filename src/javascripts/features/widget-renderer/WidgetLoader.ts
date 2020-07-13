import {
  WidgetNamespace,
  Widget,
  EditorInterface,
  Control,
} from './interfaces';
import { MarketplaceDataProvider } from './MarketplaceDataProvider';
import { createPlainClient } from 'contentful-management';
import DataLoader, { BatchLoadFn } from 'dataloader';
import { get, uniqBy } from 'lodash';
import { buildExtensionWidget, buildAppWidget } from './buildWidgets';

interface WidgetRef {
  widgetNamespace: WidgetNamespace,
  widgetId: string
}

type ClientAPI = ReturnType<typeof createPlainClient>;
type CacheValue = Widget | null;

const CUSTOM_NAMESPACES = [WidgetNamespace.APP, WidgetNamespace.EXTENSION];

const cacheKeyFn = ({ widgetNamespace, widgetId }: WidgetRef): string =>
  [widgetNamespace, widgetId].join(',');

const isWidget = (w: Widget | Error | null): w is Widget => {
  return w !== null && !(w instanceof Error);
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
      .filter(({ widgetNamespace }) => widgetNamespace === WidgetNamespace.EXTENSION)
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
    const appRefs = keys.filter(({ widgetNamespace }) => widgetNamespace === WidgetNamespace.APP);

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
      if (widgetNamespace === WidgetNamespace.APP) {
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

      if (widgetNamespace === WidgetNamespace.EXTENSION) {
        const ext = extensions.find((ext) => get(ext, ['sys', 'id']) === widgetId);

        return ext ? buildExtensionWidget(ext, this.marketplaceDataProvider) : null;
      }

      return null;
    });
  };

  private getControlWidgetRefs(controls: Control[] = []): WidgetRef[] {
    return controls
      .filter((control) => control.widgetNamespace !== WidgetNamespace.BUILTIN)
      .reduce((acc: WidgetRef[], control: Control) => {
        if (!control.widgetId) {
          return acc;
        } else if (control.widgetNamespace && CUSTOM_NAMESPACES.includes(control.widgetNamespace)) {
          return acc.concat([
            { widgetNamespace: control.widgetNamespace, widgetId: control.widgetId },
          ]);
        } else {
          return acc.concat([
            { widgetNamespace: WidgetNamespace.APP, widgetId: control.widgetId },
            { widgetNamespace: WidgetNamespace.EXTENSION, widgetId: control.widgetId },
          ]);
        }
      }, []);
  }

  private extractWidgetRefsFromEditorInterface(ei: EditorInterface): WidgetRef[] {
    return [
      ...(ei.sidebar || []),
      ...(ei.editor ? [ei.editor] : []),
      ...(ei.editors || []),
      ...this.getControlWidgetRefs(ei.controls),
    ]
      .filter((ref) => CUSTOM_NAMESPACES.includes(ref.widgetNamespace))
      .filter((ref) => ref.widgetId)
      .map(({ widgetNamespace, widgetId }) => ({ widgetNamespace, widgetId }));
  }

  public async warmUp(widgetRef: WidgetRef): Promise<void> {
    await this.loader.load(widgetRef);
  }

  public async warmUpWithEditorInterface(ei: EditorInterface): Promise<void> {
    const widgetRefs = this.extractWidgetRefsFromEditorInterface(ei);

    await this.loader.loadMany(widgetRefs);
  }

  public getOne(widgetRef: WidgetRef): Promise<Widget | null> {
    return this.loader.load(widgetRef);
  }

  public getWithEditorInterface(ei: EditorInterface): Promise<Array<Widget>> {
    const widgetRefs = this.extractWidgetRefsFromEditorInterface(ei);

    return this.getMultiple(widgetRefs);
  }

  public async getMultiple(widgetRefs: WidgetRef[]): Promise<Widget[]> {
    const widgets = await this.loader.loadMany(uniqBy(widgetRefs, cacheKeyFn));

    return widgets.filter(isWidget);
  }

  public evict(widgetRef: WidgetRef): void {
    this.loader.clear(widgetRef);
  }

  public purge(): void {
    this.loader.clearAll();
  }
}
