'use strict';

/**
 * @ngdoc service
 * @name widgets/IDMap
 * @description
 * Creates helper functions that allows one to map between public and
 * internal field IDs and locale codes.
 *
 * @usage[js]
 * var map = createIDMap(contentType.fields)
 *
 * map.field.toPublic[aField.id]  // => aField.apiName
 * map.field.toInternal[aField.apiName]  // => aField.id
 *
 * map.locale.toPublic[aLocale.internal_code]  // => aLocale.code
 * map.locale.toInternal[aLocale.code]  // => aLocale.internal_code
 */
angular.module('contentful').factory('widgets/IDMap', [
  'require',
  require => {
    const _ = require('lodash');
    const TheLocaleStore = require('TheLocaleStore');

    return createIDMap;

    function createIDMap(fields) {
      return {
        field: createFieldMap(fields),
        locale: createLocaleMap()
      };
    }

    function createFieldMap(fields) {
      const toPublic = _.transform(fields, (toPublic, field) => {
        toPublic[field.id] = field.apiName;
      });
      const toInternal = _.invert(toPublic);

      return {
        toPublic: toPublic,
        toInternal: toInternal
      };
    }

    function createLocaleMap() {
      const locales = TheLocaleStore.getPrivateLocales();

      const toPublic = _.transform(locales, (toPublic, locale) => {
        toPublic[locale.internal_code] = locale.code;
      });
      const toInternal = _.invert(toPublic);

      return {
        toPublic: toPublic,
        toInternal: toInternal,
        valuesToPublic: valuesToPublic
      };

      function valuesToPublic(localized) {
        return _.transform(
          localized,
          (transformed, value, internalLocale) => {
            transformed[toPublic[internalLocale]] = value;
          },
          {}
        );
      }
    }
  }
]);
