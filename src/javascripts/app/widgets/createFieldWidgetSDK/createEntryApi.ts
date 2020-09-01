import { createEntryFieldApi } from './createEntryFieldApi';
import { InternalContentTypeField, InternalContentType } from './createContentTypeApi';

import * as K from 'core/utils/kefir';
import { EntryAPI, EntrySys, EntryFieldAPI } from 'contentful-ui-extensions-sdk';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { FieldLocaleLookup } from 'app/entry_editor/makeFieldLocaleListeners';

interface CreateEntryApiOptions {
  internalContentType: InternalContentType;
  doc: Document;
  setInvalid: (localeCode: string, value: boolean) => void;
  fieldLocaleListeners: FieldLocaleLookup;
  readOnly?: boolean;
}

export function createEntryApi({
  internalContentType,
  doc,
  setInvalid,
  fieldLocaleListeners,
  readOnly = false,
}: CreateEntryApiOptions): EntryAPI {
  const fields = internalContentType.fields.map((internalField: InternalContentTypeField) => {
    return createEntryFieldApi({
      internalField,
      doc,
      setInvalid,
      fieldLocaleListeners,
      readOnly,
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
