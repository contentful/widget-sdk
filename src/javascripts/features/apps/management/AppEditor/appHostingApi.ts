import { getToken } from 'Authentication';
import { uploadApiUrl } from 'Config';
import { createAppDefinitionsEndpoint } from 'data/Endpoint';
import * as Config from 'Config';
import * as Auth from 'Authentication';
import { AppDefinitionWithBundle } from './AppHosting';
import { AppBundleData, DataLink } from './HostingDropzone';

export async function createAppBundleFromFile(
  definition: AppDefinitionWithBundle,
  file: File
): Promise<DataLink> {
  const binary: string | ArrayBuffer | null = await new Promise((res) => {
    const reader = new FileReader();
    reader.onload = () => {
      res(reader.result);
    };
    reader.readAsArrayBuffer(file);
  });

  const token = await getToken();

  const response = await window.fetch(
    uploadApiUrl(`/organizations/${definition.sys.organization.sys.id}/app_uploads`),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${token}`,
      },
      body: binary,
    }
  );

  const appUpload = await response.json();
  const bundleEndpoint = createAppDefinitionsEndpoint(
    Config.apiUrl(`organizations/${definition.sys.organization.sys.id}`),
    Auth
  );

  return bundleEndpoint({
    method: 'POST',
    path: [`${definition.sys.id}`, 'app_bundles'],
    data: {
      upload: { sys: { type: 'Link', linkType: 'AppUpload', id: appUpload.sys.id } },
    },
  }) as Promise<DataLink>;
}

export async function getAppBundle(definition: AppDefinitionWithBundle): Promise<AppBundleData> {
  const bundleEndpoint = createAppDefinitionsEndpoint(
    Config.apiUrl(`organizations/${definition.sys.organization.sys.id}`),
    Auth
  );

  return bundleEndpoint({
    method: 'GET',
    path: [`${definition.sys.id}`, 'app_bundles', definition.bundle?.sys.id],
  });
}
