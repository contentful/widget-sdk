import { WidgetNamespace } from "./interfaces"
import { createClient } from 'contentful-management'
import DataLoader from 'dataloader';

var client = createClient({
  // This is the access token for this space. Normally you get the token in the Contentful web app
  accessToken: 'YOUR_ACCESS_TOKEN',
})

type ClientAPI = ReturnType<typeof createClient>

async function (spaceId: string, envId: string, orgId: string) {
  
  const uis = await env.getUiExtensions()

  const appInstallations = await env.getAppInstallations();

  // Getting definitions if resolved:
  appInstallations.items[0].sys.appDefinition // -> object, not link
  // Getting definitions if includes are included:
  appInstallations.includes.AppDefinition // -> array of AppDef

  // Getting definitions if non of above works
  // We would need to do it for each source org
  ;(await client.getOrganization(orgId)).getAppDefinitions()
}

export class WidgetLoader {
  private client: ClientAPI
  private spaceId: string;
  private envId: string

  constructor(client: ClientApi, spaceId: string, envId: string) {
    this.client = client
  }

  private async load(keys: [WidgetNamespace, string][]) {
    if (keys.length < 1) {
      return [];
    }

    const space = await client.getSpace(this.spaceId)
    const env = await space.getEnvironment(this.envId)

    const extensionIds = keys
      .filter(([namespace]) => namespace === NAMESPACE_EXTENSION)
      .map(([, id]) => id);

      // Add support for the following in the SDK:
      // - sys.id[in]: list of comma separated IDs
      // - `stripSrcdoc=true`
    const { items: extensions } = await env.getUiExtensions(/*{ 'sys.id[in]': extensionIds.join(',') }*/)
    // Todo: promise.all
    const { items: installedApps } = await env.getAppInstallations()
    // Todo installed apps don't know about their definitions


    // return keys.map(([namespace, id]) => {
    //   if (namespace === NAMESPACE_APP) {
    //     const app = apps.find((app) => get(app, ['appDefinition', 'sys', 'id']) === id);

    //     return app ? buildAppWidget(app) : null;
    //   }

    //   if (namespace === NAMESPACE_EXTENSION) {
    //     const ext = extensions.find((ext) => get(ext, ['sys', 'id']) === id);

    //     return ext ? buildExtensionWidget(ext) : null;
    //   }

    //   return null;
    // });
  }

  public warmUp(namespace: WidgetNamespace, id: string): Promise<void> {

  }

  public warmUpWithEditorInterface(ei: EditorInterface): Promise<void> {

  }

  public getOne(namespace: WidgetNamespace, id: string): Promise<Widget> {

  }

  public getMultiple(keys: [WidgetNamespace, string][]): Promise<Widget[]> {

  }

  public evict(namespace: WidgetNamespace, id: string): void {

  }

  public purge(): void {

  }
}