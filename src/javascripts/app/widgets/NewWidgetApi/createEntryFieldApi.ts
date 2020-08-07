import { get } from 'lodash';
import * as K from 'core/utils/kefir';
import * as PathUtils from 'utils/Path';
import localeStore from 'services/localeStore';
import { EntryFieldAPI, Items } from 'contentful-ui-extensions-sdk';
import { getModule } from 'core/NgRegistry';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';
import { Document } from 'app/entity_editor/Document/typesDocument';

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
  internalField: InternalField,
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

function getCurrentPath(internalField: InternalField, publicLocaleCode?: string) {
  let internalLocaleCode = localeStore.getDefaultLocale().internal_code;

  if (publicLocaleCode) {
    internalLocaleCode = localeStore.toInternalCode(publicLocaleCode) ?? internalLocaleCode;
  }

  return ['fields', internalField.id, internalLocaleCode];
}

function canEdit(otDoc: Document, publicFieldId: string, publicLocaleCode?: string) {
  const externalLocaleCode = publicLocaleCode ?? localeStore.getDefaultLocale().code;
  return otDoc.permissions.canEditFieldLocale(publicFieldId, externalLocaleCode);
}

function getLocaleAndCallback(args: any[]) {
  if (args.length === 1) {
    return {
      cb: args[0],
      locale: localeStore.getDefaultLocale(),
    };
  }

  if (args.length === 2) {
    const publicLocaleCode = args[0];
    const locale = localeStore.getPrivateLocales().find((l) => l.code === publicLocaleCode);
    if (!locale) {
      throw new RangeError(`Unknown locale "${publicLocaleCode}".`);
    }

    return {
      cb: args[1],
      locale,
    };
  }

  throw new TypeError('expected either callback, or locale code and callback');
}

export interface InternalField {
  apiName?: string;
  id: string;
  localized: boolean;
  required: boolean;
  validations: Record<string, any>[];
  items?: Items | undefined;
  type: string;
}

/**
 * Makes a method throw an Exception when the API is read0only
 * This has been implemented with generics to not lose type inference, even though it's ugly
 */
const makeReadOnlyGuardedMethod = <T extends Function>(readOnly: boolean, method: T) => {
  return readOnly
    ? () => {
        throw makeReadOnlyApiError(ReadOnlyApi.EntryField);
      }
    : method;
};

export interface CreateEntryFieldApiProps {
  internalField: InternalField;
  otDoc: Document;
  setInvalid: (publicLocaleCode: string, value: boolean) => void;
  listenToFieldLocaleEvent: FieldLocaleEventListenerFn;
  readOnly?: boolean;
}

export function createEntryFieldApi({
  internalField,
  otDoc,
  setInvalid,
  listenToFieldLocaleEvent,
  readOnly,
}: CreateEntryFieldApiProps): EntryFieldAPI {
  const id = internalField.apiName ?? internalField.id;
  // We fall back to `internalField.id` because some old fields don't have an
  // apiName / public ID

  const getValue = (publicLocaleCode?: string) => {
    const currentPath = getCurrentPath(internalField, publicLocaleCode);

    return get(otDoc.getValueAt([]), currentPath);
  };

  const setValue = makeReadOnlyGuardedMethod(
    !!readOnly,
    async (value: any, publicLocaleCode?: string) => {
      if (!canEdit(otDoc, id, publicLocaleCode)) {
        throw makePermissionError();
      }

      const currentPath = getCurrentPath(internalField, publicLocaleCode);

      try {
        await otDoc.setValueAt(currentPath, value);
        return value;
      } catch (err) {
        throw makeShareJSError(err, ERROR_MESSAGES.MFAILUPDATE);
      }
    }
  );

  const removeValue = makeReadOnlyGuardedMethod(!!readOnly, async (publicLocaleCode?: string) => {
    if (!canEdit(otDoc, id, publicLocaleCode)) {
      throw makePermissionError();
    }

    const currentPath = getCurrentPath(internalField, publicLocaleCode);

    try {
      await otDoc.removeValueAt(currentPath);
    } catch (err) {
      throw makeShareJSError(err, ERROR_MESSAGES.MFAILREMOVAL);
    }
  });

  function onValueChanged(callback: (value: any) => void): () => () => void;
  function onValueChanged(
    publicLocaleCode: string,
    callback: (value: any) => void
  ): () => () => void;
  function onValueChanged(...args: any[]) {
    const { cb, locale } = getLocaleAndCallback(args);
    const path = getCurrentPath(internalField, locale.code);

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
    publicLocaleCode: string,
    callback: (isDisabled: boolean) => void
  ): () => () => void;
  function onIsDisabledChanged(...args: any[]) {
    const { cb, locale } = getLocaleAndCallback(args);
    return listenToFieldLocaleEvent(
      internalField,
      locale,
      (fieldLocale) => fieldLocale.access$,
      (access: any) => cb(!!access.disabled)
    );
  }

  function onSchemaErrorsChanged(callback: (errors: any) => void): () => () => void;
  function onSchemaErrorsChanged(
    publicLocaleCode: string,
    callback: (errors: any) => void
  ): () => () => void;
  function onSchemaErrorsChanged(...args: any[]) {
    const { cb, locale } = getLocaleAndCallback(args);
    return listenToFieldLocaleEvent(
      internalField,
      locale,
      (fieldLocale) => fieldLocale.errors$,
      (errors: any) => cb(errors || [])
    );
  }

  const locales = internalField.localized
    ? localeStore.getPrivateLocales().map((locale) => locale.code)
    : [localeStore.getDefaultLocale().code];
  const type = internalField.type;
  const required = !!internalField.required;
  const validations = internalField.validations ?? [];
  const items = internalField.items;

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
    getForLocale(publicLocaleCode) {
      return {
        id,
        locale: publicLocaleCode,
        type,
        required,
        validations,
        items,
        getValue: () => getValue(publicLocaleCode),
        setValue: (value) => setValue(value, publicLocaleCode),
        removeValue: () => removeValue(publicLocaleCode),
        onValueChanged: (cb) => onValueChanged(publicLocaleCode, cb),
        onIsDisabledChanged: (cb) =>
          onIsDisabledChanged(publicLocaleCode, cb as (isDisabled: boolean) => void),
        onSchemaErrorsChanged: (cb) =>
          onSchemaErrorsChanged(publicLocaleCode, cb as (errors: any) => void),
        setInvalid: makeReadOnlyGuardedMethod(!!readOnly, (isInvalid) =>
          setInvalid(publicLocaleCode, isInvalid)
        ),
      };
    },
  };
}
