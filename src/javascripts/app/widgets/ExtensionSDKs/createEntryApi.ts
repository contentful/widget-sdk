import { createEntryFieldApi } from './createEntryFieldApi';
import { InternalContentType, InternalContentTypeField } from './createContentTypeApi';
import * as K from 'core/utils/kefir';
import { EntryAPI, EntryFieldAPI, TaskInputData } from '@contentful/app-sdk';
import type { Document } from '@contentful/editorial-primitives';
import { FieldLocaleLookup } from 'app/entry_editor/makeFieldLocaleListeners';
import { isEqual } from 'lodash';
import APIClient from 'data/APIClient';
import type { EntryProps } from 'contentful-management/types';
interface CreateEntryApiOptions {
  cma: APIClient;
  internalContentType: InternalContentType;
  doc: Document;
  setInvalid: (localeCode: string, value: boolean) => void;
  fieldLocaleListeners: FieldLocaleLookup;
  readOnly?: boolean;
  widgetId: string;
  widgetNamespace: string;
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
      widgetId,
      widgetNamespace,
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
      return K.getValue(doc.sysProperty) as unknown as EntryProps['sys'];
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
  const { assignedToId, body, dueDate, status } = data;
  const resp = {
    status: status,
    body: body,
    assignedTo: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: assignedToId,
      },
    },
  };

  if (dueDate) {
    return { ...resp, dueDate };
  }

  return resp;
}

function reduceFields(fields: EntryFieldAPI[]) {
  return fields.reduce((acc, field) => {
    return {
      ...acc,
      [field.id]: field,
    };
  }, {});
}
