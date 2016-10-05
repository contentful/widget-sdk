'use strict';

angular.module('cf.data')

/**
 * @ngdoc service
 * @module cf.data
 * @name data/Entries
 */
.factory('data/Entries', ['require', function (require) {
  var TheLocaleStore = require('TheLocaleStore');

  return {
    internalToExternal: internalToExternal,
    internalPathToExternal: internalPathToExternal
  };

  function internalToExternal (entryData, contentTypeData) {
    var result = {sys: _.cloneDeep(entryData.sys)};

    getAllPathsOf(entryData.fields).forEach(function (path) {
      var value = _.cloneDeep(dotty.get(entryData, path));
      path = internalPathToExternal(path, contentTypeData);
      dotty.put(result, path, value);
    });

    return result;
  }

  function internalPathToExternal (path, contentTypeData) {
    var field = _.find(contentTypeData.fields, {id: path[1]});
    var fieldId = field && (field.apiName || field.id);
    var localeCode = TheLocaleStore.toPublicCode(path[2]);

    return ['fields', fieldId, localeCode];
  }

  function getAllPathsOf (fields) {
    return _.reduce(fields, function (acc, field, fieldId) {
      return acc.concat(_.reduce(field, function (acc, _locale, localeCode) {
        return acc.concat([['fields', fieldId, localeCode]]);
      }, []));
    }, []);
  }
}]);
