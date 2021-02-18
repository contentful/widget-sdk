import { get, noop } from 'lodash';
import * as K from 'core/utils/kefir';
import * as PathUtils from 'utils/Path';
import { WidgetNamespace } from '@contentful/widget-renderer';
import * as Analytics from 'analytics/Analytics';
import localeStore from 'services/localeStore';
import { EntryFieldAPI } from '@contentful/app-sdk';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { InternalContentTypeField } from './createContentTypeApi';
import { FieldLocaleLookup } from 'app/entry_editor/makeFieldLocaleListeners';

const ERROR_CODES = {
  BADUPDATE: 'ENTRY UPDATE FAILED',
  NO_PERMISSIONS: 'NOT ENOUGH PERMISSIONS',
};

const ERROR_MESSAGES = {
  MFAILUPDATE: 'Could not update entry field',
  MFAILREMOVAL: 'Could not remove value for field',
  MFAILPERMISSIONS: 'Could not update entry field',
};

export function makePermissionError() {
  const error = new Error(ERROR_MESSAGES.MFAILPERMISSIONS);
  return Object.assign(error, { code: ERROR_CODES.NO_PERMISSIONS });
}

export function makeShareJSError(shareJSError: { message: any }, message: string | undefined) {
  const data = shareJSError && shareJSError.message ? { shareJSCode: shareJSError.message } : {};

  const error = new Error(message);
  return Object.assign(error, { code: ERROR_CODES.BADUPDATE, data });
}

function getCurrentPath(internalFieldId: string, publicLocaleCode?: string) {
  let internalLocaleCode = localeStore.getDefaultLocale().internal_code;

  if (publicLocaleCode) {
    internalLocaleCode = localeStore.toInternalCode(publicLocaleCode) ?? internalLocaleCode;
  }

  return ['fields', internalFieldId, internalLocaleCode];
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
  internalField: InternalContentTypeField;
  doc: Document;
  setInvalid: (publicLocaleCode: string, value: boolean) => void;
  fieldLocaleListeners: FieldLocaleLookup;
  readOnly?: boolean;
  widgetNamespace: string;
  widgetId: string;
}

export function createEntryFieldApi({
  internalField,
  doc,
  setInvalid,
  fieldLocaleListeners,
  readOnly,
  widgetNamespace,
  widgetId,
}: CreateEntryFieldApiProps): EntryFieldAPI {
  // We fall back to `internalField.id` because some old fields don't have an
  // apiName / public ID
  const publicFieldId = internalField.apiName ?? internalField.id;

  const localeByPublicCode = localeStore.getPrivateLocales().reduce((acc, l) => {
    return { ...acc, [l.code]: l };
  }, {});

  const getLocaleAndCallback = (args: any[]) => {
    if (args.length === 1) {
      return {
        cb: args[0],
        locale: localeStore.getDefaultLocale(),
      };
    }

    if (args.length === 2) {
      const publicLocaleCode = args[0];
      const locale = localeByPublicCode[publicLocaleCode];
      if (!locale) {
        throw new RangeError(`Unknown locale "${publicLocaleCode}".`);
      }

      return {
        cb: args[1],
        locale,
      };
    }

    throw new TypeError('expected either callback, or locale code and callback');
  };

  const canEdit = (publicLocaleCode?: string) => {
    const externalLocaleCode = publicLocaleCode ?? localeStore.getDefaultLocale().code;
    return doc.permissions.canEditFieldLocale(publicFieldId, externalLocaleCode);
  };

  const getValue = (publicLocaleCode?: string) => {
    const currentPath = getCurrentPath(internalField.id, publicLocaleCode);

    return get(doc.getValueAt([]), currentPath);
  };

  const setValue = makeReadOnlyGuardedMethod(
    !!readOnly,
    async (value: any, publicLocaleCode?: string) => {
      if (!canEdit(publicLocaleCode)) {
        throw makePermissionError();
      }

      const currentPath = getCurrentPath(internalField.id, publicLocaleCode);
      const entrySys = K.getValue(doc.sysProperty);

      try {
        await doc.setValueAt(currentPath, value);

        Analytics.track('extension:set_value', {
          contentTypeId: entrySys.contentType?.sys.id,
          entryId: entrySys.id,
          fieldId: internalField.id,
          localeCode: publicLocaleCode,
          extensionId: widgetId,
          appDefinitionId: widgetNamespace === WidgetNamespace.APP ? widgetId : null,
        });

        return value;
      } catch (err) {
        throw makeShareJSError(err, ERROR_MESSAGES.MFAILUPDATE);
      }
    }
  );

  const removeValue = makeReadOnlyGuardedMethod(!!readOnly, async (publicLocaleCode?: string) => {
    if (!canEdit(publicLocaleCode)) {
      throw makePermissionError();
    }

    const currentPath = getCurrentPath(internalField.id, publicLocaleCode);

    try {
      await doc.removeValueAt(currentPath);
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
    const path = getCurrentPath(internalField.id, locale.code);

    return K.onValueWhile(
      doc.changes,
      doc.changes.filter((changedPath: any) => PathUtils.isAffecting(changedPath, path)),
      () => {
        cb(get(doc.getValueAt([]), path));
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
    const fieldLocale = get(fieldLocaleListeners, [publicFieldId, locale.code]);

    return fieldLocale ? fieldLocale.onDisabledChanged(cb) : noop;
  }

  function onSchemaErrorsChanged(callback: (errors: any) => void): () => () => void;
  function onSchemaErrorsChanged(
    publicLocaleCode: string,
    callback: (errors: any) => void
  ): () => () => void;
  function onSchemaErrorsChanged(...args: any[]) {
    const { cb, locale } = getLocaleAndCallback(args);
    const fieldLocale = get(fieldLocaleListeners, [publicFieldId, locale.code]);

    return fieldLocale ? fieldLocale.onSchemaErrorsChanged(cb) : noop;
  }

  const locales = internalField.localized
    ? localeStore.getPrivateLocales().map((locale) => locale.code)
    : [localeStore.getDefaultLocale().code];
  const type = internalField.type;
  const required = !!internalField.required;
  const validations = internalField.validations ?? [];
  const items = internalField.items;

  return {
    id: publicFieldId,
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
        id: publicFieldId,
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
