import { apiUrl, uploadApiUrl } from 'Config';

export function getHostParams(): { host: string; hostUpload: string; insecure: boolean } {
  const apiUrlValue = apiUrl();
  const uploadApiUrlValue = uploadApiUrl();

  let host = apiUrlValue;
  let hostUpload = uploadApiUrlValue;
  let insecure = false;
  if (apiUrlValue.startsWith('https://')) {
    insecure = false;
    host = apiUrlValue.replace('https://', '').replace(/\/$/, '');
    hostUpload = uploadApiUrlValue.replace('https://', '').replace(/\/$/, '');
  } else if (apiUrlValue.startsWith('http://')) {
    insecure = true;
    host = apiUrlValue.replace('http://', '').replace(/\/$/, '');
    hostUpload = uploadApiUrlValue.replace('http://', '').replace(/\/$/, '');
  }

  return {
    insecure,
    host,
    hostUpload,
  };
}
