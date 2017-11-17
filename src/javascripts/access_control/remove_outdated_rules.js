'use strict';

angular.module('contentful').factory('PolicyBuilder/removeOutdatedRules', ['require', function (require) {

  var CONFIG = require('PolicyBuilder/CONFIG');

  var PATHS = [
    'entries.allowed',
    'entries.denied',
    'assets.allowed',
    'assets.denied'
  ];

  return function removeOutdatedRules(internal, contentTypes, locales) {

    var filtered = filterPolicies(internal);

    if (countPolicies(internal) !== countPolicies(filtered)) {
      _.extend(internal, filtered);
      return true;
    }

    return false;

    function filterPolicies(internal) {
      return _.transform(PATHS, function (acc, path) {
        var collection = _.get(internal, path, []);
        var filtered = filterPolicyCollection(collection);
        _.set(acc, path, filtered);
      }, {});
    }

    function countPolicies(wrapper) {
      return _.reduce(PATHS, function (acc, path) {
        return acc + _.get(wrapper, path, []).length;
      }, 0);
    }

    function filterPolicyCollection(collection) {
      return _.filter(collection, function (p) {
        return !isMissingContentType(p) && !isMissingField(p) && !isMissingLocale(p);
      });
    }

    function isMissingContentType(p) {
      return isSpecific(p.contentType, CONFIG.ALL_CTS) && !hasContentType(p.contentType);
    }

    function isMissingField(p) {
      return !!p.isPath && isSpecific(p.field, CONFIG.ALL_FIELDS) && !hasField(p.contentType, p.field);
    }

    function isMissingLocale(p) {
      return !!p.isPath && isSpecific(p.locale, CONFIG.ALL_LOCALES) && !hasLocale(p.locale);
    }

    function isSpecific(value, allValue) {
      return _.isString(value) && value !== allValue;
    }

    function hasContentType(ctId) {
      return _.isObject(findCt(ctId));
    }

    function hasField(ctId, fieldId) {
      var ct = findCt(ctId);
      var fields = _.get(ct, 'data.fields', []);
      var field = _.find(fields, {apiName: fieldId}) || _.find(fields, {id: fieldId});
      return _.isObject(field);
    }

    function hasLocale(localeCode) {
      return _.isObject(_.find(locales, {code: localeCode}));
    }

    function findCt(ctId) {
      return _.find(contentTypes, {data: {sys: {id: ctId}}});
    }
  };
}]);
