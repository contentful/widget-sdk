import { get } from 'lodash';
import * as K from 'core/utils/kefir';
import * as PathUtils from 'utils/Path';
import localeStore from 'services/localeStore';
import { EntryFieldAPI } from 'contentful-ui-extensions-sdk';
import { getModule } from 'core/NgRegistry';

const ERROR_CODES = {
  BADUPDATE: 'ENTRY UPDATE FAILED',
  NO_PERMISSIONS: 'NOT ENOUGH PERMISSIONS',
};

const ERROR_MESSAGES = {
  MFAILUPDATE: 'Could not update entry field',
  MFAILREMOVAL: 'Could not remove value for field',
  MFAILPERMISSIONS: 'Could not update entry field',
};

export type FieldLocaleEventListenerFn = (
  field: any,
  locale: any,
  extractFieldLocaleProperty: (fieldLocale: any) => any,
  cb: (value: any) => void
) => () => void;

export function makeFieldLocaleEventListener($scope: any): FieldLocaleEventListenerFn {
  return (field, locale, extractFieldLocaleProperty, cb) => {
    const fieldLocaleScope = $scope.$new(false);
    fieldLocaleScope.widget = { field };
    fieldLocaleScope.locale = locale;

    const fieldLocale = getModule('$controller')('FieldLocaleController', {
      $scope: fieldLocaleScope,
    });

    return K.onValueScope($scope, extractFieldLocaleProperty(fieldLocale), cb);
  };
}

export function makePermissionError() {
  const error = new Error(ERROR_MESSAGES.MFAILPERMISSIONS);
  return Object.assign(error, { code: ERROR_CODES.NO_PERMISSIONS });
}

export function makeShareJSError(shareJSError: { message: any }, message: string | undefined) {
  const data = shareJSError && shareJSError.message ? { shareJSCode: shareJSError.message } : {};

  const error = new Error(message);
  return Object.assign(error, { code: ERROR_CODES.BADUPDATE, data });
}

function getCurrentPath(field: { id: string }, localeCode?: string) {
  let internalLocaleCode = localeStore.getDefaultLocale().internal_code;

  if (localeCode) {
    internalLocaleCode = localeStore.toInternalCode(localeCode) ?? internalLocaleCode;
  }

  return ['fields', field.id, internalLocaleCode];
}

function canEdit(otDoc: any, field: { apiName: string }, localeCode?: string) {
  const externalLocaleCode = localeCode ?? localeStore.getDefaultLocale().code;
  return otDoc.permissions.canEditFieldLocale(field.apiName, externalLocaleCode);
}

function getLocaleAndCallback(args: any[]) {
  if (args.length === 1) {
    return {
      cb: args[0],
      locale: localeStore.getDefaultLocale(),
    };
  }

  if (args.length === 2) {
    const localeCode = args[0];
    const locale = localeStore.getPrivateLocales().find((l) => l.code === localeCode);
    if (!locale) {
      throw new RangeError(`Unknown locale "${localeCode}".`);
    }

    return {
      cb: args[1],
      locale,
    };
  }

  throw new TypeError('expected either callback, or locale code and callback');
}

export function createEntryFieldApi({
  field,
  otDoc,
  setInvalid,
  listenToFieldLocaleEvent,
}: {
  field: any;
  otDoc: any;
  setInvalid: (localeCode: string, value: boolean) => void;
  listenToFieldLocaleEvent: FieldLocaleEventListenerFn;
}): EntryFieldAPI {
  const getValue = (localeCode?: string) => {
    const currentPath = getCurrentPath(field, localeCode);

    return get(otDoc.getValueAt([]), currentPath);
  };

  const setValue = async (value: any, localeCode?: string) => {
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

  const removeValue = async (localeCode?: string) => {
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

  function onValueChanged(callback: (value: any) => void): () => () => void;
  function onValueChanged(locale: string, callback: (value: any) => void): () => () => void;
  function onValueChanged(...args: any[]) {
    const { cb, locale } = getLocaleAndCallback(args);
    const path = getCurrentPath(field, locale.code);

    return K.onValueWhile(
      otDoc.changes,
      otDoc.changes.filter((changedPath: any) => PathUtils.isAffecting(changedPath, path)),
      () => {
        cb(get(otDoc.getValueAt([]), path));
      }
    );
  }

  function onIsDisabledChanged(callback: (isDisabled: boolean) => void): () => () => void;
  function onIsDisabledChanged(
    locale: string,
    callback: (isDisabled: boolean) => void
  ): () => () => void;
  function onIsDisabledChanged(...args: any[]) {
    const { cb, locale } = getLocaleAndCallback(args);
    return listenToFieldLocaleEvent(
      field,
      locale,
      (fieldLocale) => fieldLocale.access$,
      (access: any) => cb(!!access.disabled)
    );
  }

  function onSchemaErrorsChanged(callback: (errors: any) => void): () => () => void;
  function onSchemaErrorsChanged(locale: string, callback: (errors: any) => void): () => () => void;
  function onSchemaErrorsChanged(...args: any[]) {
    const { cb, locale } = getLocaleAndCallback(args);
    return listenToFieldLocaleEvent(
      field,
      locale,
      (fieldLocale) => fieldLocale.errors$,
      (errors: any) => cb(errors || [])
    );
  }

  const id = field.apiName ?? field.id;
  const locales = field.localized
    ? localeStore.getPrivateLocales().map((locale) => locale.code)
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
        onIsDisabledChanged: (cb) =>
          onIsDisabledChanged(localeCode, cb as (isDisabled: boolean) => void),
        onSchemaErrorsChanged: (cb) =>
          onSchemaErrorsChanged(localeCode, cb as (errors: any) => void),
        setInvalid: (isInvalid) => setInvalid(localeCode, isInvalid),
      };
    },
  };
}
