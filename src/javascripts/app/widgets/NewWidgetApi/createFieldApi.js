import * as K from 'utils/kefir';
import * as PathUtils from 'utils/Path';
import { get } from 'lodash';

/**
 * @typedef { import("contentful-ui-extensions-sdk").FieldAPI } FieldAPI
 */

const ERROR_CODES = { EBADUPDATE: 'ENTRY UPDATE FAILED' };

const ERROR_MESSAGES = {
  MFAILUPDATE: 'Could not update entry field',
  MFAILREMOVAL: 'Could not remove value for field'
};

function makeShareJSError(shareJSError, message) {
  const data = {};
  if (shareJSError && shareJSError.message) {
    data.shareJSCode = shareJSError.message;
  }

  const error = new Error(message);
  return Object.assign(error, { code: ERROR_CODES.EBADUPDATE, data });
}

export function createInternalFieldApi({ locale, field, $scope }) {
  const currentPath = ['fields', field.id, locale.internal_code];

  return {
    locale: locale.code,
    id: field.apiName || field.id,
    type: field.type,
    required: !!field.required,
    validations: field.validations || [],
    items: field.items || [],

    getValue: () => {
      return get($scope.otDoc.getValueAt([]), currentPath);
    },
    setValue: async function setValue(value) {
      try {
        await $scope.otDoc.setValueAt(currentPath, value);
        return value;
      } catch (err) {
        throw makeShareJSError(err, ERROR_MESSAGES.MFAILUPDATE);
      }
    },
    removeValue: async function removeValue() {
      try {
        await $scope.otDoc.removeValueAt(currentPath);
      } catch (err) {
        throw makeShareJSError(err, ERROR_MESSAGES.MFAILREMOVAL);
      }
    },
    onValueChanged: cb => {
      return K.onValueScope(
        $scope,
        $scope.otDoc.changes.filter(path => PathUtils.isAffecting(path, currentPath)),
        () => {
          cb(get($scope.otDoc.getValueAt([]), currentPath));
        }
      );
    },
    setInvalid: () => {},
    onIsDisabledChanged: () => {},
    onSchemaErrorsChanged: () => {}
  };
}

/**
 * @param {{ $scope: Object }}
 * @return {FieldAPI}
 */
export function createFieldApi({ $scope }) {
  const current = {
    field: $scope.widget.field,
    locale: $scope.locale
  };

  return {
    ...createInternalFieldApi({
      locale: current.locale,
      field: current.field,
      $scope
    }),
    setInvalid: isInvalid => {
      $scope.fieldController.setInvalid(current.locale.code, isInvalid);
    },
    onIsDisabledChanged: cb => {
      return K.onValueScope($scope, $scope.fieldLocale.access$, access => {
        cb(!!access.disabled);
      });
    },
    onSchemaErrorsChanged: cb => {
      return K.onValueScope($scope, $scope.fieldLocale.errors$, errors => {
        cb(errors || []);
      });
    }
  };
}
