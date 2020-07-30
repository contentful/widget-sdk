import { createEntryFieldApi } from './createEntryFieldApi';

import * as K from 'core/utils/kefir';
import { EntryAPI, EntryFieldAPI } from 'contentful-ui-extensions-sdk';

export function createEntryApi({ internalContentType, $scope }): EntryAPI {
  const fields = internalContentType.fields.map((field: any) => {
    return createEntryFieldApi({ field, $scope, internalContentType });
  });

  return {
    getSys: () => {
      return K.getValue($scope.otDoc.sysProperty);
    },
    onSysChanged: (cb) => {
      return K.onValue($scope.otDoc.sysProperty, cb as (value: unknown) => void);
    },
    fields: reduceFields(fields),
    metadata: $scope.otDoc.getValueAt(['metadata']),
  };
}

function reduceFields(fields: EntryFieldAPI[]) {
  return fields.reduce((acc, field) => {
    return {
      ...acc,
      [field.id]: field,
    };
  }, {});
}
