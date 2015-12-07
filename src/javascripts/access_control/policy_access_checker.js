'use strict';

angular.module('contentful').factory('accessChecker/policy', ['$injector', function ($injector) {

  var PolicyBuilder = $injector.get('PolicyBuilder');

  var policies = {
    entry : {
      allowed: {flat: [], byContentType: {}},
      denied: {flat: [], byContentType: {}}
    },
    asset : {allowed: [], denied: []}
  };

  return {
    setRole:               setRole,
    canAccessEntries:      function () { return policies.entry.allowed.flat.length > 0; },
    canAccessAssets:       function () { return policies.asset.allowed.length > 0; },
    hasEntryAllowPolicies: function (contentTypeId) { return getAllowed(contentTypeId).length > 0; },
    hasAssetAllowPolicies: function () { return policies.asset.allowed.length > 0; },
    getFieldChecker:       getFieldChecker
  };

  function setRole(role) {
    var internal = role ? PolicyBuilder.toInternal(role) : {};
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

  function getFieldChecker(opts) {
    opts.predicate = opts.predicate || _.constant(true);

    return {
      isEditable: function (field, locale) { return  check(field, locale); },
      isDisabled: function (field, locale) { return !check(field, locale); }
    };

    function check(field, locale) {
      var extendedOpts = _.extend({}, opts, { field: field, locale: locale });
      return opts.predicate() && isEditable(extendedOpts);
    }
  }

  function isEditable(opts) {
    var fieldId    = opts.field.apiName || opts.field.id;
    var localeCode = opts.locale.internal_code;
    var canUpdate  = opts.baseCanUpdateFn();

    var allowed = opts.type === 'Asset' ? policies.asset.allowed : getAllowed(opts.contentTypeId);
    var denied  = opts.type === 'Asset' ? policies.asset.denied  : getDenied(opts.contentTypeId);

    allowed = pathPoliciesOnly(allowed);
    denied  = pathPoliciesOnly(denied);

    if (opts.type === 'Asset' && allowed.length > 0)         { canUpdate = false; }
    if (checkPolicyCollection(allowed, fieldId, localeCode)) { canUpdate = true;  }
    if (checkPolicyCollection(denied,  fieldId, localeCode)) { canUpdate = false; }

    return canUpdate;
  }

  function getAllowed(contentTypeId) {
    return pathPoliciesOnly(policies.entry.allowed.byContentType[contentTypeId] || []);
  }

  function getDenied(contentTypeId) {
    return pathPoliciesOnly(policies.entry.denied.byContentType[contentTypeId] || []);
  }

  function pathPoliciesOnly(collection) {
    return _.filter(collection, isPathPolicy);
  }

  function isPathPolicy(p) {
    return p.action === 'update' && !_.isNull(p.locale) && !_.isNull(p.field);
  }

  function checkPolicyCollection(collection, fieldId, localeCode) {
    return _.some(collection, function (p) {
      return (
        _.contains(['all', fieldId], p.field) &&
        _.contains(['all', localeCode], p.locale)
      );
    });
  }
}]);
