'use strict';

angular.module('contentful')
.factory('EntityHelpers', ['$injector', function ($injector) {

  var $q = $injector.get('$q');
  var $controller = $injector.get('$controller');
  var spaceContext = $injector.get('spaceContext');
  var assetUrlFilter = $injector.get('$filter')('assetUrl');
  var entityStatusController = $controller('EntityStatusController');

  var api = {
    entityStatus: entityStatus,
    entityTitle: wrap('entityTitle'),
    entityDescription: wrap('entityDescription'),
    entryImage: wrap('entryImage'),
    assetFile: assetFile,
    assetUrl: assetUrl
  };

  return {
    api: api,
    forLocale: forLocale
  };

  function forLocale (locale) {
    return _.extend(_.clone(api), {
      entityTitle: _.partialRight(api.entityTitle, locale),
      entityDescription: _.partialRight(api.entityDescription, locale),
      entryImage: _.partialRight(api.entryImage, locale),
      assetFile: _.partialRight(api.assetFile, locale)
    });
  }

  function entityStatus (data) {
    var isPublished = !!data.sys.publishedVersion;
    return $q.resolve(entityStatusController.getClassname({
      isPublished: _.constant(isPublished),
      hasUnpublishedChanges: _.constant(!isPublished || data.sys.version > data.sys.publishedVersion + 1),
      isArchived: _.constant(!!data.sys.archivedVersion)
    }));
  }

  function wrap (method) {
    return function (data, localeCode) {
      return dataToEntity(data).then(function (entity) {
        return spaceContext[method](entity, localeCode);
      });
    };
  }

  function dataToEntity (data) {
    var prepareFields = $q.resolve(data.fields);
    var ctId = dotty.get(data, 'sys.contentType.sys.id');

    if (data.sys.type === 'Entry') {
      prepareFields = spaceContext
      .fetchPublishedContentType(ctId)
      .then(function (ct) {
        return _.transform(ct.data.fields, function (acc, ctField) {
          var field = dotty.get(data, ['fields', ctField.apiName]);
          if (field) {
            acc[ctField.id] = field;
          }
        }, {});
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
    return $q.resolve(dotty.get(data, 'fields.file.' + locale, null));
  }

  function assetUrl (url) {
    return $q.resolve(assetUrlFilter(url));
  }
}]);
