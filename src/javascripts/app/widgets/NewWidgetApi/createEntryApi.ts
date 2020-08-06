import {
  createEntryFieldApi,
  FieldLocaleEventListenerFn,
  InternalField,
} from './createEntryFieldApi';

import * as K from 'core/utils/kefir';
import { EntryAPI, EntrySys, EntryFieldAPI, ContentType } from 'contentful-ui-extensions-sdk';
import { Document } from 'app/entity_editor/Document/typesDocument';

interface CreateEntryApiOptions {
  internalContentType: ContentType;
  otDoc: Document;
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
      // TODO: the EntitySys type in otDoc doesn't match EntrySys from UIESDK
      return (K.getValue(otDoc.sysProperty) as unknown) as EntrySys;
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
