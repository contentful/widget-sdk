import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';

/**
 * @ngdoc service
 * @name EntityEditor/DataFields
 */
registerFactory('EntityEditor/DataFields', [
  'TheLocaleStore',
  TheLocaleStore => {
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
    function buildFieldsApi(fields, otDoc) {
      return _.transform(
        fields,
        (fieldsApi, field) => {
          // TODO we should normalize fields so that the API name is always
          // defined.
          const publicId = field.apiName || field.id;
          fieldsApi[publicId] = createField(field, otDoc);
        },
        {}
      );
    }

    function createField(field, otDoc) {
      const internalId = field.id;
      const publicId = field.apiName || internalId;
      const locales = getPublicLocaleCodes(field);

      return {
        id: publicId,
        locales: locales,
        getValue: getValue,
        setValue: setValue,
        removeValue: removeValue,
        onValueChanged: onValueChanged
      };

      function getValue(locale) {
        return otDoc.getValueAt(makeLocalePath(internalId, locale));
      }

      function setValue(value, locale) {
        return otDoc.setValueAt(makeLocalePath(internalId, locale), value);
      }

      function removeValue(value, locale) {
        return otDoc.removeValueAt(makeLocalePath(internalId, locale), value);
      }

      function onValueChanged(locale, cb) {
        if (!cb) {
          cb = locale;
          locale = undefined;
        }
        const path = makeLocalePath(internalId, locale);
        return K.onValue(otDoc.valuePropertyAt(path), cb);
      }
    }

    function getDefaultLocaleCode() {
      return TheLocaleStore.getDefaultLocale().code;
    }

    function makeLocalePath(id, publicLocale) {
      const locale = getInternalLocaleCode(publicLocale);
      return ['fields', id, locale];
    }

    function getInternalLocaleCode(publicCode) {
      publicCode = publicCode || getDefaultLocaleCode();
      const internalLocaleCode = TheLocaleStore.toInternalCode(publicCode);
      if (internalLocaleCode) {
        return internalLocaleCode;
      } else {
        throw new Error('Unknown locale "' + publicCode + '"');
      }
    }

    function getPublicLocaleCodes(field) {
      let locales;
      if (field.localized) {
        locales = TheLocaleStore.getPrivateLocales();
      } else {
        locales = [TheLocaleStore.getDefaultLocale()];
      }
      return _.map(locales, 'code');
    }
  }
]);
