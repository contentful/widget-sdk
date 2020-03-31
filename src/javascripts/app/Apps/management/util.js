import { getSpaces } from 'services/TokenStore';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { create as createSpaceEnvRepo } from 'data/CMA/SpaceEnvironmentsRepo';
import * as urlSafeBase64 from 'urlsafe-base64';

export async function getOrgSpacesFor(orgId) {
  const spaces = await getSpaces();

  return spaces.filter((s) => s.organization.sys.id === orgId);
}

export async function getEnvsFor(spaceId) {
  const spaceEndpoint = createSpaceEndpoint(spaceId, 'master');
  const spaceEnvRepo = createSpaceEnvRepo(spaceEndpoint);
  const { environments } = await spaceEnvRepo.getAll();

  return environments;
}

export function keyPemTobase64Der(pem) {
  const base64Der = pem.replace(/-*(BEGIN|END) PUBLIC KEY-*/g, '').replace(/\s+/g, '');

  return base64Der;
}

export async function getSha256FromBase64(base64String) {
  const binaryDer = window.atob(base64String);
  const derArray = new Uint8Array(binaryDer.length);

  for (let i = 0; i < binaryDer.length; i++) {
    derArray[i] = binaryDer.charCodeAt(i);
  }

  const fingerprintArray = new Uint8Array(await window.crypto.subtle.digest('SHA-256', derArray));
  let fingerprintBinary = '';

  for (let i = 0; i < fingerprintArray.length; i++) {
    fingerprintBinary += String.fromCharCode(fingerprintArray[i]);
  }

  return fingerprintBinary;
}

export function base64ToHex(base64String) {
  const u8Array = urlSafeBase64.decode(base64String);

  let hex = '';

  for (let i = 0; i < u8Array.length; i++) {
    hex += u8Array[i].toString(16).padStart(2, '0');
  }

  return hex;
}
