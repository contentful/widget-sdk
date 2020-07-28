import { get, noop } from 'lodash';
import * as K from 'core/utils/kefir';
import { createReadOnlyFieldApi, makePermissionError, makeShareJSError } from './createFieldApi';
import localeStore from 'services/localeStore';
import * as PathUtils from 'utils/Path';
import { getModule } from 'core/NgRegistry';
import makeListOfFieldLocales from 'widgets/bridges/makeListOfFieldLocales';

/**
 * @typedef { import("contentful-ui-extensions-sdk").EntryAPI } EntryAPI
 */

const ERROR_MESSAGES = {
  MFAILUPDATE: 'Could not update entry field',
  MFAILREMOVAL: 'Could not remove value for field',
  MFAILPERMISSIONS: 'Could not update entry field',
};

/**
 * @param {API.ContentType} contentType
 * @param {API.Locale} locale
 * @param {API.Entry} entry
 * @return {EntryAPI}
 */
export function createReadOnlyEntryApi({ contentType, locale, entry }) {
  const fields = contentType.fields.map((field) => {
    const getValue = () => get(entry, ['fields', field.id, locale.internal_code]);
    return createReadOnlyFieldApi({ field, locale, getValue });
  });

  return {
    getSys: () => entry.sys,
    onSysChanged: noop,
    fields: reduceFields(fields),
  };
}

/**
 * @param {API.ContentType} contentType
 * @param {Document} otDoc
 * @param $scope
 * @return {EntryAPI}
 */
export function createEntryApi({ contentType, otDoc, $scope }) {
  const fields = contentType.fields.map((field) => {
    return createInternalEntryFieldApi({ field, otDoc, $scope, contentType });
  });

  return {
    getSys: () => {
      return K.getValue(otDoc.sysProperty);
    },
    onSysChanged: (cb) => {
      return K.onValue(otDoc.sysProperty, cb);
    },
    fields: reduceFields(fields),
    metadata: otDoc.getValueAt(['metadata']),
  };
}

function reduceFields(fields) {
  return fields.reduce((acc, field) => {
    return {
      ...acc,
      [field.id]: field,
    };
  }, {});
}

function canEdit(otDoc, field, localeCode) {
  const externalLocaleCode = localeCode ?? localeStore.getDefaultLocale().code;
  return otDoc.permissions.canEditFieldLocale(field.apiName, externalLocaleCode);
}

function getCurrentPath(field, localeCode) {
  const internalLocaleCode =
    localeStore.toInternalCode(localeCode) ?? localeStore.getDefaultLocale().internal_code;
  const currentPath = ['fields', field.id, internalLocaleCode];
  return currentPath;
}

function getLocaleCodeAndCallback(args) {
  if (args.length === 1) {
    return {
      cb: args[0],
      localeCode: localeStore.getDefaultLocale().code,
    };
  } else if (args.length === 2) {
    return {
      cb: args[1],
      localeCode: args[0],
    };
  }

  // TODO: make me better
  throw new TypeError('Unexpected arity for callback');
}

/**
 * @param field
 * @param getValue
 * @return {FieldAPI}
 */
export function createReadOnlyInternalEntryFieldApi({ field, getValue }) {
  const id = field.apiName ?? field.id;
  const locales = field.localized
    ? localeStore.getActiveLocales().map((locale) => locale.code)
    : [localeStore.getDefaultLocale().code];
  const type = field.type;
  const required = !!field.required;
  const validations = field.validations ?? [];
  const items = field.items ?? { validations: [] };

  return {
    id,
    locales,
    type,
    required,
    validations,
    items,
    getValue,
    setValue: noop,
    removeValue: noop,
    onValueChanged: noop,
    onIsDisabledChanged: noop,
    getForLocale(localeCode) {
      return {
        id,
        locale: localeCode,
        type,
        required,
        validations,
        items,
        getValue: () => getValue(localeCode),
        setValue: noop,
        removeValue: noop,
        onValueChanged: noop,
        onIsDisabledChanged: noop,
      };
    },
  };
}

/**
 * @param field
 * @param otDoc
 * @param $scope
 * @param contentType
 * @return {FieldAPI}
 */
export function createInternalEntryFieldApi({ field, otDoc, $scope, contentType }) {
  const getValue = (localeCode) => {
    const currentPath = getCurrentPath(field, localeCode);

    return get(otDoc.getValueAt([]), currentPath);
  };

  const setValue = async (value, localeCode) => {
    if (!canEdit(otDoc, field, localeCode)) {
      throw makePermissionError();
    }

    const currentPath = getCurrentPath(field, localeCode);

    try {
      await otDoc.setValueAt(currentPath, value);
      return value;
    } catch (err) {
      throw makeShareJSError(err, ERROR_MESSAGES.MFAILUPDATE);
    }
  };

  const removeValue = async (localeCode) => {
    if (!canEdit(otDoc, field, localeCode)) {
      throw makePermissionError();
    }

    const currentPath = getCurrentPath(field, localeCode);

    try {
      await otDoc.removeValueAt(currentPath);
    } catch (err) {
      throw makeShareJSError(err, ERROR_MESSAGES.MFAILREMOVAL);
    }
  };

  const onValueChanged = (...args) => {
    const { cb, localeCode } = getLocaleCodeAndCallback(args);
    const trackingPath = getCurrentPath(field, localeCode);

    return K.onValueWhile(
      otDoc.changes,
      otDoc.changes.filter((path) => PathUtils.isAffecting(path, trackingPath)),
      () => {
        cb(get(otDoc.getValueAt([]), trackingPath));
      }
    );
  };

  const onIsDisabledChanged = (...args) => {
    const { cb, localeCode } = getLocaleCodeAndCallback(args);

    const fieldLocalesControllers = makeListOfFieldLocales(
      $scope,
      getModule('$controller'),
      contentType
    );
    const fieldLocale = fieldLocalesControllers.find(
      (i) => i.fieldId === field.apiName && i.localeCode === localeCode
    );

    if (!fieldLocale) {
      throw new RangeError(`Unknown locale code ${localeCode}`);
    }

    return K.onValueScope($scope, fieldLocale.fieldLocale.access$, (access) => {
      cb(!!access.disabled);
    });
  };

  const { id, locales, type, required, validations, items } = createReadOnlyInternalEntryFieldApi({
    field,
    getValue,
  });

  return {
    id,
    locales,
    type,
    required,
    validations,
    items,
    getValue,
    setValue,
    removeValue,
    onValueChanged,
    onIsDisabledChanged,
    getForLocale(localeCode) {
      return {
        id,
        locale: localeCode,
        type,
        required,
        validations,
        items,
        getValue: () => getValue(localeCode),
        setValue: (value) => setValue(value, localeCode),
        removeValue: () => removeValue(localeCode),
        onValueChanged: (cb) => onValueChanged(localeCode, cb),
        onIsDisabledChanged: (cb) => onIsDisabledChanged(localeCode, cb),
      };
    },
  };
}
