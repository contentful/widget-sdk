import { getAppDefinitionLoader } from '../../../../apps-core';
import * as util from '../../util';
import moment from 'moment';
import * as ManagementApiClient from '../../ManagementApiClient';

export const fetchKeys = async (orgId, definitionId) => {
  const keys = await getAppDefinitionLoader(orgId).getKeysForAppDefinition(definitionId);

  return Promise.all(keys.map(getFormattedKey));
};

export const getFormattedKey = async (key) => {
  const fingerprint = key.jwk.x5t;
  const hexFingerprint = util.base64ToHex(fingerprint).replace(/(..)/g, '$1:').replace(/:$/, '');
  const mid = hexFingerprint.length / 2 + 1;
  const fingerprintLines = [hexFingerprint.substr(0, mid), hexFingerprint.substr(mid)];

  return {
    fingerprint,
    fingerprintLines,
    createdAt: moment(key.sys.createdAt).format('MMMM DD, YYYY'),
    lastUsedAt: key.sys.lastUsedAt
      ? 'Last used ' + util.formatPastDate(key.sys.lastUsedAt)
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
