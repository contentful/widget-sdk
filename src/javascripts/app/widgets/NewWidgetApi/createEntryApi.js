import * as K from 'utils/kefir';
import { createInternalFieldApi } from './createFieldApi';
/**
 * @typedef { import("contentful-ui-extensions-sdk").EntryAPI } EntryAPI
 */

/**
 * @param {{ $scope: Object }}
 * @return {EntryAPI}
 */
export function createEntryApi({ $scope }) {
  const locale = $scope.locale;
  const fields = $scope.entityInfo.contentType.fields.map(field => {
    return createInternalFieldApi({ locale, field, $scope });
  });

  return {
    getSys: () => {
      return K.getValue($scope.otDoc.sysProperty);
    },
    onSysChanged: cb => {
      return K.onValueScope($scope, $scope.fieldLocale.doc.sys, cb);
    },
    fields: fields.reduce((acc, field) => {
      return {
        ...acc,
        [field.id]: field
      };
    }, {})
  };
}
