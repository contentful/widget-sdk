'use strict';

angular.module('contentful').factory('PolicyBuilder/removeOutdatedRules', ['$injector', function ($injector) {

  var CONFIG = $injector.get('PolicyBuilder/CONFIG');

  var collections = [
    'entries.allowed',
    'entries.denied',
    'assets.allowed',
    'assets.denied'
  ];

  return function removeOutdatedRules(internal, contentTypes, locales) {

    var extension = prepareExtension();

    if (countCollections(internal) !== countCollections(extension)) {
      _.extend(internal, extension);
      return true;
    }

    return false;

    function prepareExtension() {
      return _.reduce(collections, function (acc, c) {
        var segments = c.split('.');
        var type = segments[0];
        var effect = segments[1];
        acc[type] = acc[type] || {};
        acc[type][effect] = acc[type][effect] || {};
        acc[type][effect] = filterCollection(dotty.get(internal, c, []));
        return acc;
      }, {});
    }

    function countCollections(wrapper) {
      return _.reduce(collections, function (acc, c) {
        return acc + dotty.get(wrapper, c, []).length;
      }, 0);
    }

    function filterCollection(collection) {
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
      var fields = dotty.get(ct, 'data.fields', []);
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
