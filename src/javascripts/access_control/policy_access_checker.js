'use strict';

angular.module('contentful').factory('accessChecker/policy', ['$injector', function ($injector) {

  var PolicyBuilder = $injector.get('PolicyBuilder');
  var ALL_FIELDS    = $injector.get('PolicyBuilder/CONFIG').ALL_FIELDS;

  var policies = {
    entry : {
      allowed: {flat: [], byContentType: {}},
      denied: {flat: [], byContentType: {}}
    },
    asset : {allowed: [], denied: []}
  };

  var isAdmin = false;
  var fieldAccessCache = {};

  return {
    setMembership:          setMembership,
    canAccessEntries:       function () { return policies.entry.allowed.flat.length > 0; },
    canAccessAssets:        function () { return policies.asset.allowed.length > 0; },
    canCreateEntriesOfType: canCreateEntriesOfType,
    canUpdateEntriesOfType: canUpdateEntriesOfType,
    canUpdateOwnEntries:    canUpdateOwnEntries,
    canUpdateAssets:        canUpdateAssets,
    canUpdateOwnAssets:     canUpdateOwnAssets,
    getFieldChecker:        getFieldChecker
  };

  function setMembership(membership) {
    var role = _.first(dotty.get(membership, 'roles', []));
    var internal = role ? PolicyBuilder.toInternal(role) : {};

    isAdmin = dotty.get(membership, 'admin', false);
    fieldAccessCache = {};

    policies.entry.allowed.flat = dotty.get(internal, 'entries.allowed', []);
    policies.entry.denied.flat  = dotty.get(internal, 'entries.denied',  []);
    policies.asset.allowed = dotty.get(internal, 'assets.allowed', []);
    policies.asset.denied  = dotty.get(internal, 'assets.denied',  []);

    groupByContentType('allowed');
    groupByContentType('denied');
  }

  function groupByContentType(collectionName) {
    var collection = policies.entry[collectionName];
    collection.byContentType = {};

    _.forEach(collection.flat, function (p) {
      if (_.isString(p.contentType)) {
        collection.byContentType[p.contentType] = collection.byContentType[p.contentType] || [];
        collection.byContentType[p.contentType].push(p);
      }
    });
  }

  function getFieldChecker(contentTypeId, predicate) {
    predicate = predicate || _.constant(true);

    return {
      isEditable: function (field, locale) { return  check(field, locale); },
      isDisabled: function (field, locale) { return !check(field, locale); }
    };

    function check(field, locale) {
      return predicate() && isEditable(contentTypeId, field, locale);
    }
  }

  function isEditable(contentTypeId, field, locale) {
    var fieldId    = field.apiName || field.id;
    var localeCode = locale.internal_code;

    var cached = getCached(contentTypeId, fieldId, localeCode);
    if (cached !== null) {
      return cached;
    }

    var allowed = contentTypeId ? getAllowed(contentTypeId) : policies.asset.allowed;
    var denied  = contentTypeId ? getDenied(contentTypeId)  : policies.asset.denied;

    var hasAllowing = checkPolicyCollectionForPath(allowed, fieldId, localeCode);
    var hasDenying  = checkPolicyCollectionForPath(denied,  fieldId, localeCode);

    var result = isAdmin || (hasAllowing && !hasDenying);
    cacheResult(contentTypeId, fieldId, localeCode, result);
    return result;
  }

  function getCached(ctId, fieldId, localeCode) {
    var result = fieldAccessCache[getCacheKey(ctId, fieldId, localeCode)];

    return (result === true || result === false) ? result : null;
  }

  function cacheResult(ctId, fieldId, localeCode, result) {
    fieldAccessCache[getCacheKey(ctId, fieldId, localeCode)] = result;
  }

  function getCacheKey(ctId, fieldId, localeCode) {
    return [getCtCacheKey(ctId), fieldId, localeCode].join(',');
  }

  function getCtCacheKey(ctId) {
    return ctId ? ctId : '__cf_internal_ct_asset__';
  }

  function canCreateEntriesOfType(contentTypeId) {
    return performCheck(policies.entry.allowed.flat, policies.entry.denied.flat, function (c) {
      return _.filter(c, function (p) {
        return (
          p.scope !== 'user' &&
          _.contains(['all', 'create'], p.action) &&
          _.contains(['all', contentTypeId], p.contentType)
        );
      });
    });
  }

  function canUpdateEntriesOfType(contentTypeId) {
    return performCheck(getAllowed(contentTypeId), getDenied(contentTypeId), anyUserUpdatePoliciesOnly);
  }

  function canUpdateOwnEntries() {
    return performCheck(policies.entry.allowed.flat, policies.entry.denied.flat, currentUserUpdatePoliciesOnly);
  }

  function canUpdateAssets() {
    return performCheck(policies.asset.allowed, policies.asset.denied, anyUserUpdatePoliciesOnly);
  }

  function canUpdateOwnAssets() {
    return performCheck(policies.asset.allowed, policies.asset.denied, currentUserUpdatePoliciesOnly);
  }

  function performCheck(c1, c2, fn) {
    return fn(c1).length > 0 && fn(withoutPathRules(c2)).length === 0;
  }

  function withoutPathRules(c) {
    return _.filter(c, function (p) { return !p.isPath; });
  }

  function getAllowed(contentTypeId) {
    return getCollection('allowed', contentTypeId);
  }

  function getDenied(contentTypeId) {
    return getCollection('denied', contentTypeId);
  }

  function getCollection(name, contentTypeId) {
    var ctGroups = policies.entry[name].byContentType;
    var ctSpecificItems = ctGroups[contentTypeId] || [];
    var generalItems = ctGroups.all || [];

    return _.union(ctSpecificItems, generalItems);
  }

  function anyUserUpdatePoliciesOnly(c) {
    return _.filter(updatePoliciesOnly(c), function (p) { return p.scope !== 'user'; });
  }

  function currentUserUpdatePoliciesOnly(c) {
    return _.filter(updatePoliciesOnly(c), function (p) { return p.scope === 'user'; });
  }

  function updatePoliciesOnly(collection) {
    return _.filter(collection, function (p) {
      return _.contains(['update', 'all'], p.action);
    });
  }

  function checkPolicyCollectionForPath(collection, fieldId, localeCode) {
    return _.some(updatePoliciesOnly(collection), function (p) {
      var noPath                = doesNotMatch(p.field) && doesNotMatch(p.locale);
      var fieldOnlyPathMatched  = matchField  (p.field) && doesNotMatch(p.locale);
      var localeOnlyPathMatched = doesNotMatch(p.field) && matchLocale (p.locale);
      var bothMatched           = matchField  (p.field) && matchLocale (p.locale);

      return noPath || fieldOnlyPathMatched || localeOnlyPathMatched || bothMatched;
    });

    function matchField(field)   { return _.contains([ALL_FIELDS, fieldId], field); }
    function matchLocale(locale) { return _.contains(['all', localeCode], locale);  }
  }

  function doesNotMatch(value) { return !_.isString(value); }
}]);
