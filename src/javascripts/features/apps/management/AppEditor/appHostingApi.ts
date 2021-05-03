import { getToken } from 'Authentication';
import { uploadApiUrl } from 'Config';
import { createAppDefinitionsEndpoint } from 'data/Endpoint';
import * as Config from 'Config';
import * as Auth from 'Authentication';
import axios, { CancelToken } from 'axios';
import { AppDefinitionWithBundle } from './AppHosting';

import { createZipFromFiles } from './zipFiles';
import { Notification } from '@contentful/forma-36-react-components';
import { AppBundleData, AppUploadData } from './types';
import { FileWithPath } from './HostingDropzone';

type ProgressListener = (progress: number) => void;
export function createUpload(
  files: File[],
  definition: AppDefinitionWithBundle
): {
  uploadRequest: Promise<AppUploadData | void>;
  cancelUploadRequest: () => void;
  addProgressListener: (listener: ProgressListener) => void;
} {
  const progressListeners: ProgressListener[] = [];

  const addProgressListener = (fn: ProgressListener) => {
    progressListeners.push(fn);
  };

  const source = axios.CancelToken.source();
  const cancelToken = source.token;

  const uploadRequest = createUploadRequest(
    files,
    definition,
    progressListeners,
    cancelToken
  ).catch((e) => {
    if (!axios.isCancel(e)) {
      throw e;
    }
  });

  return {
    uploadRequest,
    addProgressListener,
    cancelUploadRequest: source.cancel.bind(source),
  };
}

export const createUploadRequest = async (
  files: File[],
  definition: AppDefinitionWithBundle,
  progressListeners: ProgressListener[],
  cancelToken: CancelToken
) => {
  let zipFile: File | Blob;
  // File is already one zip file
  if (files.length === 1 && files[0].type === 'application/zip') {
    zipFile = files[0];
  } else {
    zipFile = await createZipFromFiles(files as FileWithPath[]);
  }

  const token = await getToken();

  const response = await axios.post(
    uploadApiUrl(`/organizations/${definition.sys.organization.sys.id}/app_uploads`),
    zipFile,
    {
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${token}`,
      },
      onUploadProgress: ({ loaded, total, lengthComputable }) => {
        if (lengthComputable) {
          const progress = Math.floor((loaded / total) * 100);
          progressListeners.forEach((listener) => listener(progress));
        }
      },
      cancelToken,
    }
  );

  return response.data;
};

export const createBundleFromUpload = async (
  definition: AppDefinitionWithBundle,
  appUpload: AppUploadData,
  comment: string | undefined
): Promise<AppBundleData> => {
  const bundleEndpoint = createAppDefinitionsEndpoint(
    Config.apiUrl(`organizations/${definition.sys.organization.sys.id}`),
    Auth
  );

  const bundle: AppBundleData = await bundleEndpoint({
    method: 'POST',
    path: [`${definition.sys.id}`, 'app_bundles'],
    data: {
      upload: { sys: { type: 'Link', linkType: 'AppUpload', id: appUpload.sys.id } },
      ...(comment && comment.length > 0 ? { comment } : {}),
    },
  });

  Notification.success('Save your app to activate this bundle for all of its installations.', {
    title: 'Bundle successfully uploaded!',
  });

  return bundle;
};

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
