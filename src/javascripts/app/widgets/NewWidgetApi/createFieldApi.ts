import * as K from 'core/utils/kefir';
import { noop } from 'lodash';
import { createInternalEntryFieldApi, createReadOnlyInternalEntryFieldApi } from './createEntryApi';
import { FieldAPI } from './createNewWidgetApi';

/**
 * @typedef { import("contentful-ui-extensions-sdk").FieldAPI } FieldAPI
 */

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

export function createReadOnlyFieldApi({ field, locale, getValue = noop }): FieldAPI {
  const readOnlyInternalEntryFieldApi = createReadOnlyInternalEntryFieldApi({ field, getValue });

  return readOnlyInternalEntryFieldApi.getForLocale(locale.code);
}

export function createFieldApi({ $scope, contentType }): FieldAPI {
  const field = $scope.widget.field;
  const { locale, otDoc } = $scope;

  const internalEntryFieldApi = createInternalEntryFieldApi({ field, otDoc, $scope, contentType });
  const internalFieldApi = internalEntryFieldApi.getForLocale(locale.code);

  return {
    ...internalFieldApi,
    setInvalid: (isInvalid) => {
      $scope.fieldController.setInvalid(locale.code, isInvalid);
    },
    onIsDisabledChanged: (cb) => {
      return K.onValueScope($scope, $scope.fieldLocale.access$, (access: unknown) => {
        // @ts-ignore: TODO: can we type this better?
        cb(!!access.disabled);
      });
    },
    onSchemaErrorsChanged: (cb) => {
      return K.onValueScope($scope, $scope.fieldLocale.errors$, (errors) => {
        cb(errors || []);
      });
    },
  };
}
