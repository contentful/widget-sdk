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

  return {
    setMembership:          setMembership,
    canAccessEntries:       function () { return policies.entry.allowed.flat.length > 0; },
    canAccessAssets:        function () { return policies.asset.allowed.length > 0; },
    canCreateEntriesOfType: canCreateEntriesOfType,
    canUpdateEntriesOfType: canUpdateEntriesOfType,
    canUpdateOwnEntries:    canUpdateOwnEntries,
    canUpdateAssets:        canUpdateAssets,
    getFieldChecker:        getFieldChecker
  };

  function setMembership(membership) {
    var role = _.first(dotty.get(membership, 'roles', []));
    var internal = role ? PolicyBuilder.toInternal(role) : {};

    isAdmin = dotty.get(membership, 'admin', false);
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

    var allowed = contentTypeId ? getAllowed(contentTypeId) : policies.asset.allowed;
    var denied  = contentTypeId ? getDenied(contentTypeId)  : policies.asset.denied;

    var hasAllowing = checkPolicyCollectionForPath(allowed, fieldId, localeCode);
    var hasDenying  = checkPolicyCollectionForPath(denied,  fieldId, localeCode);

    return isAdmin || (hasAllowing && !hasDenying);
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
    return performCheck(policies.asset.allowed, policies.asset.denied, updatePoliciesOnly);
  }

  function performCheck(c1, c2, fn) {
    return fn(c1).length > 0 && fn(c2).length === 0;
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
      var noPath = (
        _.isNull(p.field) &&
        _.isNull(p.locale)
      );
      var fieldOnlyPathMatched = (
        _.contains([ALL_FIELDS, fieldId], p.field) &&
        _.isNull(p.locale)
      );
      var localeOnlyPathMatched = (
        _.isNull(p.field) &&
        _.contains(['all', localeCode], p.locale)
      );
      var bothMatched = (
        _.contains([ALL_FIELDS, fieldId], p.field) &&
        _.contains(['all', localeCode], p.locale)
      );

      return noPath || fieldOnlyPathMatched || localeOnlyPathMatched || bothMatched;
    });
  }
}]);
