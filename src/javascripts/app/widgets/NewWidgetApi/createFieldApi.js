import * as K from 'utils/kefir';
import * as PathUtils from 'utils/Path';
import localeStore from 'services/localeStore';
import { get, noop } from 'lodash';

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
 * @return {FieldAPI}
 */
export function createReadOnlyFieldApi({ field, locale, getValue = noop }) {
  return {
    locale: locale.code,
    id: field.apiName || field.id,
    type: field.type,
    required: !!field.required,
    validations: field.validations || [],
    items: field.items || [],
    getValue,
    setValue: noop,
    removeValue: noop,
    onValueChanged: noop,
    setInvalid: noop,
    onIsDisabledChanged: noop,
    onSchemaErrorsChanged: noop
  };
}

export function createInternalFieldApi({ field, locale, otDoc }) {
  const currentPath = ['fields', field.id, locale.internal_code];

  return {
    ...createReadOnlyFieldApi({ locale, field }),

    getValue: () => {
      return get(otDoc.getValueAt([]), currentPath);
    },
    setValue: async function setValue(value) {
      try {
        await otDoc.setValueAt(currentPath, value);
        return value;
      } catch (err) {
        throw makeShareJSError(err, ERROR_MESSAGES.MFAILUPDATE);
      }
    },
    removeValue: async function removeValue() {
      try {
        await otDoc.removeValueAt(currentPath);
      } catch (err) {
        throw makeShareJSError(err, ERROR_MESSAGES.MFAILREMOVAL);
      }
    },
    /*
      can be: onValueChanged(cb) or onValueChanged(locale, cb)
    */
    onValueChanged: (...args) => {
      let cb;
      let trackingPath = currentPath;

      if (args.length === 1) {
        cb = args[0];
      } else if (args.length === 2) {
        trackingPath = ['fields', field.id, localeStore.toInternalCode(args[0]) || args[0]];
        cb = args[1];
      }

      return K.onValueWhile(
        otDoc.changes,
        otDoc.changes.filter(path => PathUtils.isAffecting(path, trackingPath)),
        () => {
          cb(get(otDoc.getValueAt([]), trackingPath));
        }
      );
    }
  };
}

/**
 * @param {{ $scope: Object }}
 * @return {FieldAPI}
 */
export function createFieldApi({ $scope }) {
  const field = $scope.widget.field;
  const { locale, otDoc } = $scope;

  return {
    ...createInternalFieldApi({
      locale,
      field,
      otDoc
    }),
    setInvalid: isInvalid => {
      $scope.fieldController.setInvalid(locale.code, isInvalid);
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
