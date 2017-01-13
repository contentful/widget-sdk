'use strict';

angular.module('cf.app')
.factory('EntityHelpers', ['require', function (require) {

  var $q = require('$q');
  var spaceContext = require('spaceContext');
  var assetUrlFilter = require('$filter')('assetUrl');

  var api = {
    entityTitle: wrapAsEntity('entityTitle'),
    entityDescription: wrapAsEntity('entityDescription'),
    entryImage: wrapAsEntity('entryImage'),
    assetFile: assetFile,
    assetFileUrl: assetFileUrl
  };

  return {
    api: api,
    newForLocale: newForLocale
  };

  function newForLocale (locale) {
    return _.extend(_.clone(api), {
      entityTitle: _.partialRight(api.entityTitle, locale),
      entityDescription: _.partialRight(api.entityDescription, locale),
      entryImage: _.partialRight(api.entryImage, locale),
      assetFile: _.partialRight(api.assetFile, locale)
    });
  }

  function wrapAsEntity (methodName) {
    return function (data, localeCode) {
      return dataToEntity(data).then(function (entity) {
        return spaceContext[methodName](entity, localeCode);
      });
    };
  }

  /**
   * Accepts entity payload with public field ids and returns an object
   * that mocks the @contentful/client library interface of the entity.
   * In particular it uses private ids.
   */
  function dataToEntity (data) {
    var prepareFields = $q.resolve(data.fields);
    var ctId = dotty.get(data, 'sys.contentType.sys.id');

    if (data.sys.type === 'Entry') {
      prepareFields = spaceContext
      .publishedCTs.fetch(ctId)
      .then(function (ct) {
        if (ct) {
          return _.transform(ct.data.fields, function (acc, ctField) {
            var field = dotty.get(data, ['fields', ctField.apiName]);
            if (field) {
              acc[ctField.id] = field;
            }
          }, {});
        } else {
          return data.fields;
        }
      });
    }

    return prepareFields.then(function (fields) {
      return {
        data: {fields: fields, sys: data.sys},
        getType: _.constant(data.sys.type),
        getContentTypeId: _.constant(ctId)
      };
    });
  }

  function assetFile (data, locale) {
    var file = dotty.get(data, 'fields.file.' + locale);

    if (_.isObject(file)) {
      return $q.resolve(file);
    } else {
      return $q.reject();
    }
  }

  function assetFileUrl (file) {
    if (_.isObject(file) && file.url) {
      return $q.resolve(assetUrlFilter(file.url));
    } else {
      return $q.reject();
    }
  }
}]);
