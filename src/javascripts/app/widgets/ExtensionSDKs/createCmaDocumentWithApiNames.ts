import { Document } from '@contentful/editorial-primitives';
import { Entry } from 'core/typings';
import { isEqual } from 'lodash';
import { InternalContentType } from './createContentTypeApi';

export function createCmaDocumentWithApiNames(
  doc: Document,
  contentType: InternalContentType
): Document {
  function getPathWithApiNames(path: string[]): string[] {
    if (path[0] === 'fields' && path.length >= 2) {
      return [path[0], getFieldApiName(contentType, path[1]), ...path.slice(2)];
    } else {
      return path;
    }
  }

  function getPathWithIds(path: string[]): string[] {
    if (path[0] === 'fields' && path.length >= 2) {
      return [path[0], getFieldId(contentType, path[1]), ...path.slice(2)];
    } else {
      return path;
    }
  }

  function getValueWithIds(path: string[], value: any) {
    if (isEqual(path, [])) {
      return {
        ...value,
        fields: convertFieldPropertyToIds(value.fields, contentType),
      };
    }
    if (isEqual(path, ['fields'])) {
      return convertFieldPropertyToIds(value, contentType);
    }
    return value;
  }

  const wrappedDocument: Document = {
    ...doc,
    getValueAt: (path: string[]) => {
      const idPath = getPathWithIds(path);
      const data: any = doc.getValueAt(idPath);

      if (isEqual(path, [])) {
        const updatedEntry = {
          ...(data as Entry),
          fields: convertFieldPropertyToApiNames((data as Entry).fields, contentType),
        };
        return updatedEntry;
      }
      if (isEqual(path, ['fields'])) {
        return convertFieldPropertyToApiNames(data as Entry['fields'], contentType);
      }

      return data;
    },
    setValueAt: async (path, value) => {
      const idPath = getPathWithIds(path);
      const convertedValue = getValueWithIds(path, value);
      return await doc.setValueAt(idPath, convertedValue);
    },
    insertValueAt: async (path, i, value) => {
      const idPath = getPathWithIds(path);
      const convertedValue = getValueWithIds(path, value);
      return await doc.insertValueAt(idPath, i, convertedValue);
    },
    pushValueAt: async (path, value) => {
      const idPath = getPathWithIds(path);
      const convertedValue = getValueWithIds(path, value);
      return await doc.pushValueAt(idPath, convertedValue);
    },
    removeValueAt: async (path) => {
      await doc.removeValueAt(getPathWithIds(path));
    },
    on: (type, fn) => {
      return doc.on(type, (entry) => {
        const updatedEntry = {
          ...entry,
          fields: convertFieldPropertyToApiNames(entry.fields, contentType),
        };
        return fn(updatedEntry);
      });
    },
    data$: doc.data$.map((entry) => {
      return {
        ...entry,
        fields: convertFieldPropertyToApiNames(entry.fields, contentType),
      };
    }),
    changes: doc.changes.map((path) => getPathWithApiNames(path)),
    permissions: {
      can: doc.permissions.can,
      canEditFieldLocale: (apiName, localeCode) => {
        return doc.permissions.canEditFieldLocale(getFieldId(contentType, apiName), localeCode);
      },
    },
  };

  return wrappedDocument;
}

function convertFieldPropertyToApiNames(
  fields: Entry['fields'],
  contentType: InternalContentType
): Entry['fields'] {
  return Object.fromEntries(
    Object.entries(fields).map(([id, field]) => [getFieldApiName(contentType, id), field])
  );
}

function convertFieldPropertyToIds(
  fields: Entry['fields'],
  contentType: InternalContentType
): Entry['fields'] {
  return Object.fromEntries(
    Object.entries(fields).map(([apiName, field]) => [getFieldId(contentType, apiName), field])
  );
}

function getFieldId(contentType: InternalContentType, fieldApiName: string): string {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return contentType.fields.find((field) => field.apiName === fieldApiName)!.id;
}

function getFieldApiName(contentType: InternalContentType, fieldId: string): string {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const field = contentType.fields.find((field) => field.id === fieldId)!;

  return field.apiName ?? fieldId;
}
