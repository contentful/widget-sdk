import { createEntryFieldApi, FieldLocaleEventListenerFn } from './createEntryFieldApi';
import { InternalContentTypeField, InternalContentType } from './createContentTypeApi';

import * as K from 'core/utils/kefir';
import { EntryAPI, EntrySys, EntryFieldAPI } from 'contentful-ui-extensions-sdk';
import { Document } from 'app/entity_editor/Document/typesDocument';

export function createEntryApi({
  internalContentType,
  doc,
  setInvalid,
  listenToFieldLocaleEvent,
}: {
  internalContentType: InternalContentType;
  doc: Document;
  setInvalid: (localeCode: string, value: boolean) => void;
  listenToFieldLocaleEvent: FieldLocaleEventListenerFn;
}): EntryAPI {
  const fields = internalContentType.fields.map((internalField: InternalContentTypeField) => {
    return createEntryFieldApi({
      internalField,
      doc,
      setInvalid,
      listenToFieldLocaleEvent,
    });
  });

  return {
    getSys: () => {
      // TODO: the EntitySys type in doc doesn't match EntrySys from UIESDK
      return (K.getValue(doc.sysProperty) as unknown) as EntrySys;
    },
    onSysChanged: (cb) => {
      return K.onValue(doc.sysProperty, cb as (value: unknown) => void);
    },
    fields: reduceFields(fields),
    metadata: doc.getValueAt(['metadata']),
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
