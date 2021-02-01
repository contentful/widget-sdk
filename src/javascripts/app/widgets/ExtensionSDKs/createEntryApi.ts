import { createEntryFieldApi } from './createEntryFieldApi';
import { InternalContentType, InternalContentTypeField } from './createContentTypeApi';
import * as K from 'core/utils/kefir';
import { EntryAPI, EntryFieldAPI, EntrySys, TaskInputData } from 'contentful-ui-extensions-sdk';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { FieldLocaleLookup } from 'app/entry_editor/makeFieldLocaleListeners';
import { isEqual } from 'lodash';
import APIClient from 'data/APIClient';
interface CreateEntryApiOptions {
  cma: APIClient;
  internalContentType: InternalContentType;
  doc: Document;
  setInvalid: (localeCode: string, value: boolean) => void;
  fieldLocaleListeners: FieldLocaleLookup;
  readOnly?: boolean;
  widgetNamespace: string;
  widgetId: string;
}

export function createEntryApi({
  cma,
  internalContentType,
  doc,
  setInvalid,
  fieldLocaleListeners,
  readOnly = false,
  widgetNamespace,
  widgetId,
}: CreateEntryApiOptions): EntryAPI {
  const fields = internalContentType.fields.map((internalField: InternalContentTypeField) => {
    return createEntryFieldApi({
      internalField,
      doc,
      setInvalid,
      fieldLocaleListeners,
      readOnly,
      widgetNamespace,
      widgetId,
    });
  });

  const internalApi = {
    getMetadata: () => {
      return doc.getValueAt(['metadata']);
    },
    onMetadataChanged: (cb) => {
      return (
        doc.data$
          // metadata is mutated which makes `skipDuplicates` always skip as identical objects are compared
          .map((value) => ({ ...value.metadata }))
          .skipDuplicates(isEqual)
          .observe(cb).unsubscribe
      );
    },
  };

  return {
    getSys: () => {
      // TODO: the EntitySys type in doc doesn't match EntrySys from UIESDK
      return (K.getValue(doc.sysProperty) as unknown) as EntrySys;
    },
    onSysChanged: (cb) => {
      return K.onValue(doc.sysProperty, cb as (value: unknown) => void);
    },
    fields: reduceFields(fields),
    ...(internalApi as any),
    // TODO: remove after workflows app doesn't use it anymore
    metadata: doc.getValueAt(['metadata']),

    // Task API
    getTasks: () => cma.getTasks(K.getValue(doc.sysProperty).id),
    getTask: (...args) => cma.getTask(K.getValue(doc.sysProperty).id, ...args),
    updateTask: (...args) => cma.updateTask(K.getValue(doc.sysProperty).id, ...args),
    deleteTask: (...args) => cma.deleteTask(K.getValue(doc.sysProperty).id, ...args),
    createTask: (data) =>
      cma.createTask(K.getValue(doc.sysProperty).id, transformUserLinkOnTask(data)),
  };
}

function transformUserLinkOnTask(data: TaskInputData) {
  return {
    status: data.status,
    body: data.body,
    assignedTo: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: data.assignedToId,
      },
    },
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
