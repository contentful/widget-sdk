import PolicyBuilder from 'PolicyBuilder';
import CONFIG from 'PolicyBuilder/CONFIG';
import {get, isString, identity} from 'lodash';

const policies = {
  entry: {
    allowed: {flat: [], byContentType: {}},
    denied: {flat: [], byContentType: {}}
  },
  asset: {allowed: [], denied: []}
};

let isAdmin = false;
let fieldAccessCache = {};

export const canAccessEntries = () => policies.entry.allowed.flat.length > 0;
export const canAccessAssets = () => policies.asset.allowed.length > 0;

export function setMembership (membership) {
  const internals = get(membership, 'roles', [])
    .map((role) => role && PolicyBuilder.toInternal(role))
    .filter(identity);

  isAdmin = get(membership, 'admin', false);
  fieldAccessCache = {};

  policies.entry.allowed.flat = reduceInternals(internals, 'entries.allowed');
  policies.entry.denied.flat = reduceInternals(internals, 'entries.denied');
  policies.asset.allowed = reduceInternals(internals, 'assets.allowed');
  policies.asset.denied = reduceInternals(internals, 'assets.denied');

  groupByContentType('allowed');
  groupByContentType('denied');
  groupByEntityId('entry', 'allowed');
  groupByEntityId('entry', 'denied');
}

// TODO only pass field id and locale code
// Separate method for assets
export function canEditFieldLocale (contentTypeId, field, locale) {
  const fieldId = field.apiName || field.id;
  const localeCode = locale.code;

  const cached = getCached(contentTypeId, fieldId, localeCode);
  if (cached !== null) {
    return cached;
  }

  const allowed = contentTypeId
    ? getAllowed(contentTypeId).concat(getAllowedEntries())
    : policies.asset.allowed;

  const denied = contentTypeId
    ? getDenied(contentTypeId).concat(getDeniedEntries())
    : policies.asset.denied;

  const hasAllowing = checkPolicyCollectionForPath(allowed, fieldId, localeCode);
  const hasDenying = checkPolicyCollectionForPath(denied, fieldId, localeCode);

  const result = isAdmin || (hasAllowing && !hasDenying);
  cacheResult(contentTypeId, fieldId, localeCode, result);
  return result;
}

export function canUpdateEntriesOfType (contentTypeId) {
  return performCheck(getAllowed(contentTypeId), getDenied(contentTypeId), anyUserUpdatePoliciesOnly);
}

export function canUpdateOwnEntries () {
  return performCheck(policies.entry.allowed.flat, policies.entry.denied.flat, currentUserUpdatePoliciesOnly);
}

export function canUpdateAssets () {
  return performCheck(policies.asset.allowed, policies.asset.denied, anyUserUpdatePoliciesOnly);
}

export function canUpdateOwnAssets () {
  return performCheck(policies.asset.allowed, policies.asset.denied, currentUserUpdatePoliciesOnly);
}

function reduceInternals (internals, path) {
  return internals.reduce((acc, internal) => acc.concat(get(internal, path, [])), []);
}

function groupByContentType (collectionName) {
  const collection = policies.entry[collectionName];
  collection.byContentType = {};

  collection.flat.forEach((p) => {
    if (isString(p.contentType)) {
      collection.byContentType[p.contentType] = collection.byContentType[p.contentType] || [];
      collection.byContentType[p.contentType].push(p);
    }
  });
}

function groupByEntityId (type, collectionName) {
  const collection = policies[type][collectionName];


  collection.byId = collection.flat.filter((p) => isString(p.entityId));
}

function getCached (ctId, fieldId, localeCode) {
  const result = fieldAccessCache[getCacheKey(ctId, fieldId, localeCode)];

  return (result === true || result === false) ? result : null;
}

function cacheResult (ctId, fieldId, localeCode, result) {
  fieldAccessCache[getCacheKey(ctId, fieldId, localeCode)] = result;
}

function getCacheKey (ctId, fieldId, localeCode) {
  return [getCtCacheKey(ctId), fieldId, localeCode].join(',');
}

function getCtCacheKey (ctId) {
  return ctId || '__cf_internal_ct_asset__';
}

function performCheck (c1, c2, fn) {
  return fn(c1).length > 0 && fn(withoutPathRules(c2)).length === 0;
}

function withoutPathRules (c) {
  return c.filter((p) => !p.isPath);
}

function getAllowed (contentTypeId) {
  return getCollection('allowed', contentTypeId);
}

function getDenied (contentTypeId) {
  return getCollection('denied', contentTypeId);
}

function getCollection (name, contentTypeId) {
  const ctGroups = policies.entry[name].byContentType;
  const ctSpecificItems = ctGroups[contentTypeId] || [];
  const generalItems = ctGroups[CONFIG.ALL_CTS] || [];

  return [...ctSpecificItems, ...generalItems];
}

function getAllowedEntries () {
  return policies.entry.allowed.byId;
}

function getDeniedEntries () {
  return policies.entry.denied.byId;
}

function anyUserUpdatePoliciesOnly (c) {
  return updatePoliciesOnly(c).filter((p) => p.scope !== 'user');
}

function currentUserUpdatePoliciesOnly (c) {
  return updatePoliciesOnly(c).filter((p) => p.scope === 'user');
}

function updatePoliciesOnly (collection) {
  return collection.filter((p) => ['update', 'all'].includes(p.action));
}

function checkPolicyCollectionForPath (collection, fieldId, localeCode) {
  return updatePoliciesOnly(collection).some((p) => {
    const noPath = !isString(p.field) && !isString(p.locale);
    const fieldOnlyPathMatched = matchField(p.field) && !isString(p.locale);
    const localeOnlyPathMatched = !isString(p.field) && matchLocale(p.locale);
    const bothMatched = matchField(p.field) && matchLocale(p.locale);

    return noPath || fieldOnlyPathMatched || localeOnlyPathMatched || bothMatched;
  });

  function matchField (field) {
    return [CONFIG.ALL_FIELDS, fieldId].includes(field);
  }

  function matchLocale (locale) {
    return [CONFIG.ALL_LOCALES, localeCode].includes(locale);
  }
}
