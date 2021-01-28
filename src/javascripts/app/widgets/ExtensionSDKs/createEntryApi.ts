import { createEntryFieldApi } from './createEntryFieldApi';
import { InternalContentType, InternalContentTypeField } from './createContentTypeApi';
import * as K from 'core/utils/kefir';
import {
  CollectionResponse,
  EntryAPI,
  EntryFieldAPI,
  EntrySys,
  Link,
} from 'contentful-ui-extensions-sdk';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { FieldLocaleLookup } from 'app/entry_editor/makeFieldLocaleListeners';
import { isEqual } from 'lodash';
import APIClient from 'data/APIClient';

type TaskState = 'active' | 'resolved';

export interface TaskSys {
  id: string;
  type: 'Task';
  parentEntity: { sys: Link };
  space: Link;
  environment: Link;
  createdBy: Link;
  createdAt: string;
  updatedBy: Link;
  updatedAt: string;
  version: number;
}

export interface TaskInputData {
  assignedToId: string;
  body: string;
  status: TaskState;
}

export interface Task {
  assignedTo: Link;
  body: string;
  status: TaskState;
  sys: TaskSys;
}

export interface InternalEntryAPI extends EntryAPI {
  getTask(id: string): Promise<Task>;
  getTasks(): Promise<CollectionResponse<Task>>;
  createTask(data: TaskInputData): Promise<Task>;
  updateTask(task: Task): Promise<Task>;
  deleteTask(task: Task): Promise<void>;
}

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
}: CreateEntryApiOptions): InternalEntryAPI {
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
    getTasks: (...args) => cma.getTasks(K.getValue(doc.sysProperty).id, ...args),
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
