import { launchAppUrl } from 'Config';

function getLaunchAppDeepLink(spaceId: string, environmentId: string, releaseId?: string): string {
  const base = launchAppUrl;
  const url =
    !environmentId || environmentId === 'master'
      ? `${base}/spaces/${spaceId}`
      : `${base}/spaces/${spaceId}/environments/${environmentId}`;

  return releaseId ? `${url}/releases/${releaseId}` : url;
}

export { getLaunchAppDeepLink };
