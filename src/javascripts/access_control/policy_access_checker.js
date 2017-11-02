'use strict';

angular.module('contentful').factory('accessChecker/policy', ['require', function (require) {
  var PolicyBuilder = require('PolicyBuilder');
  var CONFIG = require('PolicyBuilder/CONFIG');

  var policies = {
    entry: {
      allowed: {flat: [], byContentType: {}},
      denied: {flat: [], byContentType: {}}
    },
    asset: {allowed: [], denied: []}
  };

  var isAdmin = false;
  var fieldAccessCache = {};

  return {
    setMembership: setMembership,
    canAccessEntries: function () { return policies.entry.allowed.flat.length > 0; },
    canAccessAssets: function () { return policies.asset.allowed.length > 0; },
    canUpdateEntriesOfType: canUpdateEntriesOfType,
    canUpdateOwnEntries: canUpdateOwnEntries,
    canUpdateAssets: canUpdateAssets,
    canUpdateOwnAssets: canUpdateOwnAssets,
    canEditFieldLocale: canEditFieldLocale
  };

  function setMembership (membership) {
    var internals = _.get(membership, 'roles', []).map(function (role) {
      return role && PolicyBuilder.toInternal(role);
    }).filter(function (internal) {
      return !!internal;
    });

    isAdmin = _.get(membership, 'admin', false);
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

  function reduceInternals (internals, path) {
    return internals.reduce(function (acc, internal) {
      return acc.concat(_.get(internal, path, []));
    }, []);
  }

  function groupByContentType (collectionName) {
    var collection = policies.entry[collectionName];
    collection.byContentType = {};

    _.forEach(collection.flat, function (p) {
      if (_.isString(p.contentType)) {
        collection.byContentType[p.contentType] = collection.byContentType[p.contentType] || [];
        collection.byContentType[p.contentType].push(p);
      }
    });
  }

  function groupByEntityId (type, collectionName) {
    var collection = policies[type][collectionName];


    collection.byId = collection.flat.filter(function (p) {
      return _.isString(p.entityId);
    });
  }

  // TODO only pass field id and locale code
  // Separate method for assets
  function canEditFieldLocale (contentTypeId, field, locale) {
    var fieldId = field.apiName || field.id;
    var localeCode = locale.code;

    var cached = getCached(contentTypeId, fieldId, localeCode);
    if (cached !== null) {
      return cached;
    }

    var allowed = contentTypeId
      ? getAllowed(contentTypeId).concat(getAllowedEntries())
      : policies.asset.allowed;

    var denied = contentTypeId
      ? getDenied(contentTypeId).concat(getDeniedEntries())
      : policies.asset.denied;

    var hasAllowing = checkPolicyCollectionForPath(allowed, fieldId, localeCode);
    var hasDenying = checkPolicyCollectionForPath(denied, fieldId, localeCode);

    var result = isAdmin || (hasAllowing && !hasDenying);
    cacheResult(contentTypeId, fieldId, localeCode, result);
    return result;
  }

  function getCached (ctId, fieldId, localeCode) {
    var result = fieldAccessCache[getCacheKey(ctId, fieldId, localeCode)];

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

  function canUpdateEntriesOfType (contentTypeId) {
    return performCheck(getAllowed(contentTypeId), getDenied(contentTypeId), anyUserUpdatePoliciesOnly);
  }

  function canUpdateOwnEntries () {
    return performCheck(policies.entry.allowed.flat, policies.entry.denied.flat, currentUserUpdatePoliciesOnly);
  }

  function canUpdateAssets () {
    return performCheck(policies.asset.allowed, policies.asset.denied, anyUserUpdatePoliciesOnly);
  }

  function canUpdateOwnAssets () {
    return performCheck(policies.asset.allowed, policies.asset.denied, currentUserUpdatePoliciesOnly);
  }

  function performCheck (c1, c2, fn) {
    return fn(c1).length > 0 && fn(withoutPathRules(c2)).length === 0;
  }

  function withoutPathRules (c) {
    return _.filter(c, function (p) { return !p.isPath; });
  }

  function getAllowed (contentTypeId) {
    return getCollection('allowed', contentTypeId);
  }

  function getDenied (contentTypeId) {
    return getCollection('denied', contentTypeId);
  }

  function getCollection (name, contentTypeId) {
    var ctGroups = policies.entry[name].byContentType;
    var ctSpecificItems = ctGroups[contentTypeId] || [];
    var generalItems = ctGroups[CONFIG.ALL_CTS] || [];

    return _.union(ctSpecificItems, generalItems);
  }

  function getAllowedEntries () {
    return policies.entry.allowed.byId;
  }

  function getDeniedEntries () {
    return policies.entry.denied.byId;
  }

  function anyUserUpdatePoliciesOnly (c) {
    return _.filter(updatePoliciesOnly(c), function (p) { return p.scope !== 'user'; });
  }

  function currentUserUpdatePoliciesOnly (c) {
    return _.filter(updatePoliciesOnly(c), function (p) { return p.scope === 'user'; });
  }

  function updatePoliciesOnly (collection) {
    return _.filter(collection, function (p) {
      return _.includes(['update', 'all'], p.action);
    });
  }

  function checkPolicyCollectionForPath (collection, fieldId, localeCode) {
    return _.some(updatePoliciesOnly(collection), function (p) {
      var noPath = isNotString(p.field) && isNotString(p.locale);
      var fieldOnlyPathMatched = matchField(p.field) && isNotString(p.locale);
      var localeOnlyPathMatched = isNotString(p.field) && matchLocale(p.locale);
      var bothMatched = matchField(p.field) && matchLocale(p.locale);

      return noPath || fieldOnlyPathMatched || localeOnlyPathMatched || bothMatched;
    });

    function matchField (field) {
      return _.includes([CONFIG.ALL_FIELDS, fieldId], field);
    }

    function matchLocale (locale) {
      return _.includes([CONFIG.ALL_LOCALES, localeCode], locale);
    }
  }

  function isNotString (value) {
    return !_.isString(value);
  }
}]);
