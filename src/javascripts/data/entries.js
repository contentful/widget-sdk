'use strict';

angular.module('cf.data')

/**
 * @ngdoc service
 * @module cf.data
 * @name data/Entries
 */
.factory('data/Entries', ['require', require => {
  const TheLocaleStore = require('TheLocaleStore');

  return {
    internalToExternal: internalToExternal,
    internalPathToExternal: internalPathToExternal,
    externalToInternal: externalToInternal,
    externalPathToInternal: externalPathToInternal
  };

  function internalToExternal (entryData, contentTypeData) {
    const transformPath = _.partial(internalPathToExternal, contentTypeData);
    return transformRepresentation(entryData, transformPath);
  }

  function externalToInternal (entryData, contentTypeData) {
    const transformPath = _.partial(externalPathToInternal, contentTypeData);
    return transformRepresentation(entryData, transformPath);
  }

  function transformRepresentation (entryData, transformPath) {
    const result = {sys: _.cloneDeep(entryData.sys)};

    getAllPathsOf(entryData.fields).forEach(path => {
      const value = _.cloneDeep(_.get(entryData, path));
      _.set(result, transformPath(path), value);
    });

    return result;
  }

  function internalPathToExternal (contentTypeData, path) {
    const field = _.find(contentTypeData.fields, {id: path[1]});
    const fieldId = field && (field.apiName || field.id);
    const localeCode = TheLocaleStore.toPublicCode(path[2]);

    return ['fields', fieldId, localeCode];
  }

  function externalPathToInternal (contentTypeData, path) {
    const field = _.find(contentTypeData.fields, {apiName: path[1]});
    const fieldId = field && (field.id || field.apiName);
    const localeCode = TheLocaleStore.toInternalCode(path[2]);

    return ['fields', fieldId, localeCode];
  }

  function getAllPathsOf (fields) {
    return _.reduce(fields, (acc, field, fieldId) => acc.concat(_.reduce(field, (acc, _locale, localeCode) => acc.concat([['fields', fieldId, localeCode]]), [])), []);
  }
}]);
