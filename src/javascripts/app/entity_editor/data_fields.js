'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name EntityEditor/DataFields
 */
.factory('EntityEditor/DataFields', ['require', function (require) {
  var TheLocaleStore = require('TheLocaleStore');
  var K = require('utils/kefir');

  return {
    create: buildFieldsApi
  };

  /**
   * @ngdoc method
   * @name EntityEditor/DataFields#create
   * @description
   * Builds the `entry.fields` api as described in the widget-sdk
   *
   * @param {API.Field[]} fields
   * Fields in the entry editor
   * @param {Document} doc
   */
  function buildFieldsApi (fields, otDoc) {
    return _.transform(fields, function (fieldsApi, field) {
      var internalId = field.id;
      var publicId = field.apiName || internalId;

      fieldsApi[publicId] = createField(internalId, otDoc);
    }, {});
  }

  function createField (id, otDoc) {
    return {
      getValue: getValue,
      onValueChanged: onValueChanged
    };

    function getValue (locale) {
      return otDoc.getValueAt(makeLocalePath(id, locale));
    }

    function onValueChanged (locale, cb) {
      if (!cb) {
        cb = locale;
        locale = undefined;
      }
      var path = makeLocalePath(id, locale);
      return K.onValue(otDoc.valuePropertyAt(path), cb);
    }
  }

  function getDefaultLocaleCode () {
    return TheLocaleStore.getDefaultLocale().code;
  }

  function makeLocalePath (id, publicLocale) {
    var locale = getInternalLocaleCode(publicLocale);
    return ['fields', id, locale];
  }

  function getInternalLocaleCode (publicCode) {
    publicCode = publicCode || getDefaultLocaleCode();
    var internalLocaleCode = TheLocaleStore.toInternalCode(publicCode);
    if (internalLocaleCode) {
      return internalLocaleCode;
    } else {
      throw new Error('Unknown locale "' + publicCode + '"');
    }
  }
}]);
