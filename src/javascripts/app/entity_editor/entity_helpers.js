'use strict';

/**
 * TODO This module is basically an adapter for the entity helper methods on
 * `spaceContext` with logic split across the two modules. This makes this
 * module also stateful, i.e. it depends on the set space.
 *
 * We should collect all entity helper logic in one point and create that
 * object where it is needed.
 */
angular.module('cf.app')
.factory('EntityHelpers', ['require', function (require) {
  var $q = require('$q');
  var spaceContext = require('spaceContext');
  var assetUrlFilter = require('$filter')('assetUrl');

  return {
    newForLocale: newForLocale
  };

  function newForLocale (locale) {
    return {
      entityTitle: spaceContextDelegator('entityTitle', locale),
      entityDescription: spaceContextDelegator('entityDescription', locale),
      entryImage: spaceContextDelegator('entryImage', locale),
      assetFile: _.partialRight(assetFile, locale),
      assetFileUrl: assetFileUrl
    };
  }

  /**
   * Create a function that delegates to given space context method
   * with the given locale code.
   *
   * The argument of the returned function is external entity data.
   * This data is transformed into an entity for the space context
   * method to work.
   */
  function spaceContextDelegator (methodName, localeCode) {
    return function (data) {
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
    var ctId = _.get(data, 'sys.contentType.sys.id');

    if (data.sys.type === 'Entry') {
      prepareFields = spaceContext
      .publishedCTs.fetch(ctId)
      .then(function (ct) {
        if (ct) {
          return _.transform(ct.data.fields, function (acc, ctField) {
            var field = _.get(data, ['fields', ctField.apiName]);
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
    return $q.resolve(spaceContext.getFieldValue({data: data}, 'file', locale));
  }

  function assetFileUrl (file) {
    if (_.isObject(file) && file.url) {
      return $q.resolve(assetUrlFilter(file.url));
    } else {
      return $q.reject();
    }
  }
}]);
