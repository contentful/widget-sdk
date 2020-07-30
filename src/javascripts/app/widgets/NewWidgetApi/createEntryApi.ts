import { createEntryFieldApi } from './createEntryFieldApi';

import * as K from 'core/utils/kefir';
import { EntryAPI, EntryFieldAPI } from 'contentful-ui-extensions-sdk';

export function createEntryApi({ contentType, otDoc, $scope }): EntryAPI {
  const fields = contentType.fields.map((field: any) => {
    return createEntryFieldApi({ field, otDoc, $scope, contentType });
  });

  return {
    getSys: () => {
      return K.getValue(otDoc.sysProperty);
    },
    onSysChanged: (cb) => {
      return K.onValue(otDoc.sysProperty, cb as (value: unknown) => void);
    },
    fields: reduceFields(fields),
    metadata: otDoc.getValueAt(['metadata']),
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
