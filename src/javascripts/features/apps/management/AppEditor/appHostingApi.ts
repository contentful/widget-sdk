import { getToken } from 'Authentication';
import { uploadApiUrl } from 'Config';
import { createAppDefinitionsEndpoint } from 'data/Endpoint';
import * as Config from 'Config';
import * as Auth from 'Authentication';
import { AppDefinitionWithBundle } from './AppHosting';

import { createZipFromFiles } from './zipFiles';
import { Notification } from '@contentful/forma-36-react-components';
import { AppBundleData } from './types';
import { FileWithPath } from './HostingDropzone';

export async function createBundle(files: File[], definition: AppDefinitionWithBundle) {
  let zipFile: File | Blob | null = null;
  try {
    // File is already one zip file
    if (files.length === 1 && files[0].type === 'application/zip') {
      zipFile = files[0];
    } else {
      zipFile = await createZipFromFiles(files as FileWithPath[]);
    }
    const bundle = await createAppBundleFromFile(definition, zipFile);
    Notification.success('Save your app to activate this bundle for all of its installations.', {
      title: 'Bundle successfully uploaded! ',
    });
    return bundle;
  } catch (e) {
    Notification.error(
      e.data?.message || 'Something went wrong while uploading your deploy. Please try again.',
      { title: e.data?.message ? 'Invalid bundle' : undefined }
    );
  }
}

export async function createAppBundleFromFile(
  definition: AppDefinitionWithBundle,
  file: File | Blob
): Promise<AppBundleData> {
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
  }) as Promise<AppBundleData>;
}

export async function getAppBundle(
  orgId: string,
  defId: string,
  bundleId: string
): Promise<AppBundleData> {
  const bundleEndpoint = createAppDefinitionsEndpoint(
    Config.apiUrl(`organizations/${orgId}`),
    Auth
  );

  return bundleEndpoint({
    method: 'GET',
    path: [defId, 'app_bundles', bundleId],
  });
}

export async function deleteAppBundle(
  orgId: string,
  defId: string,
  bundleId: string
): Promise<AppBundleData> {
  const bundleEndpoint = createAppDefinitionsEndpoint(
    Config.apiUrl(`organizations/${orgId}`),
    Auth
  );

  return bundleEndpoint({
    method: 'DELETE',
    path: [defId, 'app_bundles', bundleId],
  });
}
