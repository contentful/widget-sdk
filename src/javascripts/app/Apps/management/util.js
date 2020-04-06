import { getSpaces } from 'services/TokenStore';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { create as createSpaceEnvRepo } from 'data/CMA/SpaceEnvironmentsRepo';
import * as urlSafeBase64 from 'urlsafe-base64';
import moment from 'moment';

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

export function formatPastDate(date) {
  const today = moment().startOf('day');
  const pastDay = moment(date).startOf('day');
  const dayDiff = today.diff(pastDay, 'days');

  if (dayDiff == 0) {
    return 'today';
  }

  if (dayDiff === 1) {
    return 'yesterday';
  }

  const thisWeek = moment().startOf('week');
  const pastWeek = moment(date).startOf('week');
  const weekDiff = thisWeek.diff(pastWeek, 'weeks');

  if (dayDiff < 7 || weekDiff === 0) {
    return dayDiff + ' days ago';
  }

  if (weekDiff == 1) {
    return 'last week';
  }

  const thisMonth = moment().startOf('month');
  const pastMonth = moment(date).startOf('month');
  const monthDiff = thisMonth.diff(pastMonth, 'months');

  if (weekDiff < 4 || monthDiff === 0) {
    return weekDiff + ' weeks ago';
  }

  if (monthDiff === 1) {
    return 'last month';
  }

  return monthDiff + 'months ago';
}
