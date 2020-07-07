import { WidgetNamespace, Widget, ParameterDefinition, FieldType, Location } from "./interfaces"
import { createPlainClient } from 'contentful-management'
import DataLoader from 'dataloader';
import { NAMESPACE_EXTENSION, NAMESPACE_APP } from "widgets/WidgetNamespaces";
import { get } from "lodash";

type ClientAPI = ReturnType<typeof createPlainClient>

interface Extension {
  sys: {
    type: 'Extension',
    id: string,
    srcdocSha256?: string
  },
  extension: {
    name: string,
    fieldTypes?: FieldType[],
    src?: string
    srcdoc?:string,
    sidebar?: boolean,
    parameters?: {
      instance?: ParameterDefinition[]
      installation?: ParameterDefinition[]
    }
  },
  parameters?: Record<string, string | number | boolean>
}

interface AppDefinition {
  sys: {
    type: 'AppDefinition',
    id: string
  },
  name: string,
  src?: string
  locations?: Location[]
}

interface AppInstallation {
  sys: {
    type: 'AppInstallation',
    appDefinition: {
      sys: {
        type: 'Link',
        linkType: 'AppDefinition',
        id: string
      }
    }
  },
  parameters?: Record<string, any> | Array<any> | number | string | boolean
}

interface WidgetRef {
  widgetNamespace: WidgetNamespace,
  widgetId: string
  // setting
}

interface ControlWidgetRef {
  widgetNamespace?: WidgetNamespace
  widgetId?: string
}

interface EditorInterface {
  sys: {
    type: 'EditorInterface',
    contentType: {
      sys: {
        type: 'Link',
        linkType: 'ContentType',
        id: string
      }
    }
  },
  controls?: ControlWidgetRef[]
  sidebar?: WidgetRef[]
  editor?: WidgetRef
  editors?: WidgetRef[]
}

type CacheKey = [WidgetNamespace, string];
type CacheValue = Widget | null

export class WidgetLoader {
  private client: ClientAPI
  private baseUrl: string;
  private loader: DataLoader<CacheKey, CacheValue, string>

  constructor(client: ClientAPI, spaceId: string, envId: string) {
    this.client = client
    this.baseUrl = `/spaces/${spaceId}/environments/${envId}`
    this.loader = new DataLoader(this.load.bind(this), {
      cacheKeyFn: ([ns, id]: CacheKey): string => [ns, id].join(',')
    })
  }

  private async load(keys: readonly CacheKey[]): Promise<Array<CacheValue>> {
    if (keys.length < 1) {
      return [];
    }

    const extensionIds = keys
      .filter(([namespace]) => namespace === NAMESPACE_EXTENSION)
      .map(([, id]) => id);

    
    const extensionsRes = this.client.raw.get(`${this.baseUrl}/extensions`, {
      params: {
        'sys.id[in]': extensionIds.join(',')
      }
    })

    const appInstallationsRes = this.client.raw.get(`${this.baseUrl}/app_installations`);

    const [
      { items: extensions },
      { items: installedApps, includes: { AppDefinition: usedAppDefinitions } }
    ] = (await Promise.all([extensionsRes, appInstallationsRes])) as [
      { items: Extension[] },
      { items: AppInstallation[], includes: { AppDefinition: AppDefinition[] }}
    ]

    return keys.map(([namespace, id]) => {
      if (namespace === NAMESPACE_APP) {
        const installation = installedApps.find((app) => get(app, ['appDefinition', 'sys', 'id']) === id);
        const definition = usedAppDefinitions.find((def) => get(def, ['sys', 'id']) === id)

        if (installation && definition && definition.src) {
          return this.buildAppWidget(installation, definition)
        } else {
          return null
        }
      }

      if (namespace === NAMESPACE_EXTENSION) {
        const ext = extensions.find((ext) => get(ext, ['sys', 'id']) === id);

        return ext ? this.buildExtensionWidget(ext) : null;
      }

      return null;
    });
  }

  private buildAppWidget (installation: AppInstallation, definition: AppDefinition): Widget {
    return {
      namespace: NAMESPACE_APP,
      id: definition.sys.id,
      slug: /* marketplaceSlug || */ definition.sys.id,
      iconUrl: '', // marketplace icon, fall back to the default one
      name: definition.name,
      hosting: {
        type: 'src',
        value: definition.src!
      },
      parameters: {
        definitions: {
          instance: [],
          installation: []
        },
        values: {
          instance: {},
          installation: typeof installation.parameters === 'undefined' ? {} : installation.parameters!
        }
      },
      locations: definition.locations || []
    }
  }

  private buildExtensionWidget (extension: Extension): Widget {
    const locations: Location[] = [
      {
        location: 'entry-field',
        fieldTypes: extension.extension.fieldTypes || []
      },
      { location: 'page' },
      { location: 'entry-sidebar' },
      { location: 'entry-editor' },
      { location: 'dialog' },
    ];

    if (extension.extension.sidebar) {
      locations.push({ location: 'entry-field-sidebar' })
    }

    return {
      namespace: NAMESPACE_EXTENSION,
      id: extension.sys.id,
      slug: extension.sys.id,
      iconUrl: '', // one predefined icon
      name: extension.extension.name,
      hosting: {
        type: typeof extension.sys.srcdocSha256 === 'string' ? 'srcdoc' : 'src',
        value: extension.extension.src || extension.extension.srcdoc!
      },
      parameters: {
        definitions: {
          instance: get(extension, ['extension', 'parameters', 'instance'], []),
          installation: get(extension, ['extension', 'parameters', 'installation'], [])
        },
        values: {
          instance: {},
          installation: extension.parameters || {} 
        }
      },
      locations
    }
  }

  public async warmUp(namespace: WidgetNamespace, id: string): Promise<void> {
    await this.loader.load([namespace, id])
  }

  public async warmUpWithEditorInterface(ei: EditorInterface): Promise<void> {
    const keys = [
      ...(ei.sidebar || []),
      ...(ei.editor ? [ei.editor] : []),
      ...(ei.editors || [])
    ].filter(ref => [NAMESPACE_APP, NAMESPACE_EXTENSION].includes(ref.widgetNamespace))
    .filter(ref => ref.widgetId)
    .map(ref => [ref.widgetNamespace, ref.widgetId] as [WidgetNamespace, string])

    await this.loader.loadMany(keys);
  }

  public getOne(namespace: WidgetNamespace, id: string): Promise<Widget | null> {
    
  }

  public getMultiple(keys: [WidgetNamespace, string][]): Promise<Widget[]> {

  }

  public evict(namespace: WidgetNamespace, id: string): void {
    this.loader.clear([namespace, id])
  }

  public purge(): void {
    this.loader.clearAll();
  }
}