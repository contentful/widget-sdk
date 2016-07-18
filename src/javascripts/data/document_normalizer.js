'use strict';

angular.module('cf.data')

/**
 * @ngdoc service
 * @module cf.data
 * @name data/documentNormalizer
 */
.factory('data/documentNormalizer', [function () {
  return {
    normalize: normalize
  };


  /**
   * @ngdoc method
   * @module cf.data
   * @name data/documentNormalizer#normalize
   * @description
   * Normalize an entry or asset document by removing unused fields.
   *
   * In particular
   * - Remove field value if the locale code does not exist.
   * - Remove field objects if the field is not in the content type
   *   anymore. (Only applies if `contentType` parameter is given.
   * - Make sure that every field object is actually an object.
   *
   * Note that the first two transformation are performed on the raw
   * document snapshot. This means they are not saved and this might
   * lead to unintended behavior.
   *
   * @param {Document} otDoc
   * @param {object} snapshot
   * @param {Client.ContentType?} contentType
   * @param {API.Locale[]} locales
   */
  function normalize (otDoc, snapshot, contentType, locales) {
    var ctFields = dotty.get(contentType, ['data', 'fields']);
    var localeMap = makeLocaleMap(locales);
    removeUnknownLocales(snapshot, localeMap);
    removeDeletedFields(snapshot, ctFields);
    forceFieldObject(otDoc, ctFields);
  }


  function forceFieldObject (otDoc, ctFields) {
    _.forEach(ctFields, function (field) {
      var docField = otDoc.getValueAt(['fields', field.id]);
      if (!_.isObject(docField)) {
        otDoc.setValueAt(['fields', field.id], {});
      }
    });
  }


  /**
   * From a list of locale objects, return a map that has the internal
   * locale codes as keys.
   */
  function makeLocaleMap (locales) {
    return _.transform(locales, function (map, locale) {
      map[locale.internal_code] = true;
    }, {});
  }


  function removeUnknownLocales (data, localeMap) {
    _.forEach(data.fields, function (field) {
      _.keys(field).forEach(function (internalCode) {
        if (!localeMap[internalCode]) {
          delete field[internalCode];
        }
      });
    });
    return data;
  }


  function removeDeletedFields (snapshot, ctFields) {
    if (!ctFields) {
      return;
    }

    var ctFieldIds = _.map(ctFields, function (field) {
      return field.id;
    });

    _.forEach(snapshot.fields, function (_fieldValue, fieldId) {
      if (ctFieldIds.indexOf(fieldId) < 0) {
        delete snapshot.fields[fieldId];
      }
    });
  }
}]);
