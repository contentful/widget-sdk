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

/**
 * @param {{ $scope: Object }}
 * @return {FieldAPI}
 */
export function createFieldApi({ $scope }) {
  const current = {
    field: $scope.widget.field,
    locale: $scope.locale
  };

  const currentPath = ['fields', current.field.id, current.locale.internal_code];

  return {
    locale: current.locale.code,
    id: current.field.apiName || current.field.id,
    type: current.field.type,
    required: !!current.field.required,
    validations: current.field.validations || [],
    items: current.field.items || [],

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
    setInvalid: isInvalid => {
      $scope.fieldController.setInvalid(current.locale.code, isInvalid);
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
