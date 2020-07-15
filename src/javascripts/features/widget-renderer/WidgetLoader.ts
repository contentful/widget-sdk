import {
  WidgetNamespace,
  Widget,
  EditorInterface,
  Control,
  AppInstallation,
  AppDefinition,
  Extension,
} from './interfaces';
import { MarketplaceDataProvider } from './MarketplaceDataProvider';
import { createPlainClient } from 'contentful-management';
import DataLoader, { BatchLoadFn } from 'dataloader';
import { uniqBy, noop } from 'lodash';
import { buildExtensionWidget, buildAppWidget } from './buildWidgets';
import { isCustomWidget } from '.';

interface WidgetRef {
  widgetNamespace: WidgetNamespace;
  widgetId: string;
}

interface WidgetLoadWarning {
  message: string;
  ids: string[];
  fallbackRes: any;
  err: any;
}

type ClientAPI = ReturnType<typeof createPlainClient>;
type CacheValue = Widget | null;
type WarningCallbackFn = (warning: WidgetLoadWarning) => void;

const EMPTY_EXTENSIONS_RES = { items: [] };
const EMPTY_APPS_RES = { items: [], includes: { AppDefinition: [] } };

const cacheKeyFn = ({ widgetNamespace, widgetId }: WidgetRef): string => {
  return [widgetNamespace, widgetId].join(',');
};

const isWidget = (w: Widget | Error | null): w is Widget => {
  return w !== null && !(w instanceof Error);
};

const getIdsOf = (widgetRefs: readonly WidgetRef[], ns: WidgetNamespace) => {
  return widgetRefs
    .filter(({ widgetNamespace }) => widgetNamespace === ns)
    .map(({ widgetId }) => widgetId);
};

export class WidgetLoader {
  private client: ClientAPI;
  private marketplaceDataProvider: MarketplaceDataProvider;
  private baseUrl: string;
  private loader: DataLoader<WidgetRef, CacheValue, string>;
  private onWarning: WarningCallbackFn;

  constructor(
    client: ClientAPI,
    marketplaceDataProvider: MarketplaceDataProvider,
    spaceId: string,
    envId: string,
    onWarning?: WarningCallbackFn
  ) {
    this.client = client;
    this.marketplaceDataProvider = marketplaceDataProvider;
    this.baseUrl = `/spaces/${spaceId}/environments/${envId}`;
    this.loader = new DataLoader(this.load.bind(this), {
      cacheKeyFn,
    });
    this.onWarning = onWarning || noop;
  }

  private handleApiFailure = (message: string, ids: string[], fallbackRes: any) => {
    return (err: any) => {
      this.onWarning({ message, ids, fallbackRes, err });
      return fallbackRes;
    };
  };

  private load: BatchLoadFn<WidgetRef, CacheValue> = async (widgetRefs) => {
    if (widgetRefs.length < 1) {
      return [];
    }

    const extensionIds = getIdsOf(widgetRefs, WidgetNamespace.EXTENSION);
    const extensionIdsParam = { 'sys.id[in]': extensionIds.join(',') };
    const extensionsRes =
      extensionIds.length > 0
        ? this.client.raw.get(`${this.baseUrl}/extensions`, { params: extensionIdsParam })
        : Promise.resolve(EMPTY_EXTENSIONS_RES);

    const appIds = getIdsOf(widgetRefs, WidgetNamespace.APP);
    const appInstallationsRes =
      appIds.length > 0
        ? this.client.raw.get(`${this.baseUrl}/app_installations`)
        : Promise.resolve(EMPTY_APPS_RES);

    const [
      { items: extensions },
      {
        items: appInstallations,
        includes: { AppDefinition: appDefinitions },
      },
    ] = await Promise.all([
      extensionsRes.catch(
        this.handleApiFailure('Failed to load extensions', extensionIds, EMPTY_EXTENSIONS_RES)
      ),
      appInstallationsRes.catch(
        this.handleApiFailure('Failed to load apps', appIds, EMPTY_APPS_RES)
      ),
      this.marketplaceDataProvider
        .prefetch()
        .catch(this.handleApiFailure('Failed to load marketplace data', appIds, undefined)),
    ]);

    return widgetRefs.map(({ widgetId, widgetNamespace }) => {
      if (widgetNamespace === WidgetNamespace.APP) {
        return this.buildAppWidget(appInstallations, appDefinitions, widgetId);
      } else if (widgetNamespace === WidgetNamespace.EXTENSION) {
        this.buildExtensionWidget(extensions, widgetId);
      } else {
        return null;
      }
    });
  };

  private buildAppWidget(
    appInstallations: AppInstallation[],
    appDefinitions: AppDefinition[],
    widgetId: string
  ): Widget | null {
    const installation = appInstallations.find((i) => i.sys.appDefinition.sys.id === widgetId);
    const definition = appDefinitions.find((d) => d.sys.id === widgetId);

    if (installation && definition && definition.src) {
      return buildAppWidget(installation, definition, this.marketplaceDataProvider);
    } else {
      return null;
    }
  }

  private buildExtensionWidget(extensions: Extension[], widgetId: string): Widget | null {
    const extension = extensions.find((e: Extension) => e.sys.id === widgetId);

    return extension ? buildExtensionWidget(extension, this.marketplaceDataProvider) : null;
  }

  private getControlWidgetRefs(controls: Control[] = []): WidgetRef[] {
    return controls
      .filter((control) => control.widgetNamespace !== WidgetNamespace.BUILTIN)
      .reduce((acc: WidgetRef[], control: Control) => {
        if (!control.widgetId) {
          return acc;
        } else if (control.widgetNamespace && isCustomWidget(control.widgetNamespace)) {
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
      .filter((ref) => isCustomWidget(ref.widgetNamespace))
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

  public async getInstalledApps(): Promise<Widget[]> {
    const {
      items: appInstallations,
      includes: { AppDefinition: appDefinitions },
    } = await this.client.raw.get(`${this.baseUrl}/app_installations`);

    const widgetRefs: WidgetRef[] = appInstallations.map((i: AppInstallation) => ({
      widgetNamespace: WidgetNamespace.APP,
      widgetId: i.sys.appDefinition.sys.id,
    }));

    widgetRefs.forEach((ref) => {
      const widget = this.buildAppWidget(appInstallations, appDefinitions, ref.widgetId);
      this.loader.prime(ref, widget);
    });

    return this.getMultiple(widgetRefs);
  }

  public evict(widgetRef: WidgetRef): void {
    this.loader.clear(widgetRef);
  }

  public purge(): void {
    this.loader.clearAll();
  }
}
