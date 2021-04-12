import { formatPastDate, base64ToHex, ManagementApiClient } from 'features/apps';
import moment from 'moment';

export interface Key {
  fingerprint: string;
  fingerprintLines: string[];
  createdAt: string;
  createdBy: string;
  lastUsedAt: string;
}

export const fetchKeys = async (orgId, definitionId): Promise<Key[]> => {
  const keys = await ManagementApiClient.getKeysForAppDefinition(orgId, definitionId);

  return Promise.all(keys.map(getFormattedKey));
};

export const getFormattedKey = async (key) => {
  const fingerprint = key.jwk.x5t;
  const hexFingerprint = base64ToHex(fingerprint).replace(/(..)/g, '$1:').replace(/:$/, '');
  const mid = hexFingerprint.length / 2 + 1;
  const fingerprintLines = [hexFingerprint.substr(0, mid), hexFingerprint.substr(mid)];

  return {
    fingerprint,
    fingerprintLines,
    createdAt: moment(key.sys.createdAt).format('MMMM DD, YYYY'),
    lastUsedAt: key.sys.lastUsedAt
      ? 'Last used ' + formatPastDate(key.sys.lastUsedAt)
      : 'Never used',
    // TODO: batch getting creators
    createdBy: await ManagementApiClient.getCreatorNameOf(key),
  };
};

export const downloadAsFile = (mimeType: string, payload: string, fileName: string) => {
  const temporaryAnchor = document.createElement('a');
  temporaryAnchor.download = fileName;

  const blob = new Blob([payload], {
    type: mimeType,
  });

  temporaryAnchor.href = URL.createObjectURL(blob);

  temporaryAnchor.click();

  URL.revokeObjectURL(temporaryAnchor.href);
};
