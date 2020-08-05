import {
  createEntryFieldApi,
  FieldLocaleEventListenerFn,
  InternalField,
} from './createEntryFieldApi';

import * as K from 'core/utils/kefir';
import { EntryAPI, EntryFieldAPI, ContentType } from 'contentful-ui-extensions-sdk';

interface CreateEntryApiOptions {
  internalContentType: ContentType;
  otDoc: any;
  setInvalid: (localeCode: string, value: boolean) => void;
  listenToFieldLocaleEvent: FieldLocaleEventListenerFn;
  readOnly?: boolean;
}

export function createEntryApi({
  internalContentType,
  otDoc,
  setInvalid,
  listenToFieldLocaleEvent,
  readOnly = false,
}: CreateEntryApiOptions): EntryAPI {
  const fields = internalContentType.fields.map((internalField: InternalField) => {
    return createEntryFieldApi({
      internalField,
      otDoc,
      setInvalid,
      listenToFieldLocaleEvent,
      readOnly,
    });
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
