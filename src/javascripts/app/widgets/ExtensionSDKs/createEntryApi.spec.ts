import { createEntryApi, InternalEntryAPI } from './createEntryApi';
import { InternalContentType } from './createContentTypeApi';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { constant } from 'kefir';
import { onValue } from 'core/utils/kefir';
import { noop } from 'lodash';
import * as Kefir from 'kefir';
import jestKefir from 'jest-kefir';
import { WidgetNamespace } from '@contentful/widget-renderer';
import APIClient from 'data/APIClient';

const kefirHelpers = jestKefir(Kefir);

jest.mock('services/localeStore', () => {
  const originalModule = jest.requireActual('services/localeStore');

  return {
    ...originalModule.default,
    getDefaultLocale: () => ({ internal_code: 'internalCode', code: 'en-US' }), // eslint-disable-line @typescript-eslint/camelcase
  };
});

jest.mock('core/utils/kefir', () => {
  const originalModule = jest.requireActual('core/utils/kefir');

  return {
    ...originalModule,
    onValue: jest.fn(),
  };
});

const cma = ({
  getTasks: jest.fn(),
  getTask: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
} as any) as APIClient;

const mockField = {
  disabled: false,
  localized: false,
  omitted: false,
  required: false,
  type: 'Symbol',
  validations: [],
};

describe('createEntryApi', () => {
  let entryApi: InternalEntryAPI;
  const internalContentType = {
    sys: {
      type: 'ContentType',
      id: 'someid',
    },
    fields: [
      { ...mockField, id: 'field_one', apiName: 'first_field', name: 'the first field' },
      { ...mockField, id: 'field_two', name: 'the second field' },
    ],
    name: 'content_type',
    description: 'a content type',
    displayField: '',
  } as InternalContentType;
  const docData = kefirHelpers.stream();
  const doc = ({
    data$: docData,
    getValueAt: jest.fn(),
    sysProperty: constant({ id: 'example' }),
  } as unknown) as Document;
  const setInvalid = noop;
  beforeEach(() => {
    entryApi = createEntryApi({
      cma,
      internalContentType,
      doc,
      setInvalid,
      fieldLocaleListeners: {},
      widgetId: 'my-app',
      widgetNamespace: WidgetNamespace.APP,
    });
  });

  describe('getSys', () => {
    it('returns sys from doc', () => {
      const result = entryApi.getSys();
      expect(result).toEqual({ id: 'example' });
    });
  });

  describe('onSysChanged', () => {
    it('calls Kefir onvalue with the callback', () => {
      const callback = jest.fn();
      entryApi.onSysChanged(callback);
      expect(onValue).toHaveBeenCalledWith(doc.sysProperty, callback);
    });
  });

  describe('getMetadata', () => {
    it('returns metadata from doc', () => {
      (entryApi as any).getMetadata();
      expect(doc.getValueAt).toHaveBeenCalledWith(['metadata']);
    });
  });

  describe('onMetadataChanged', () => {
    it('calls Kefir onvalue with the callback', () => {
      const callback = jest.fn();
      (entryApi as any).onMetadataChanged(callback);

      kefirHelpers.send(docData, [kefirHelpers.value({ metadata: { tags: ['a', 'b'] } })]);
      kefirHelpers.send(docData, [kefirHelpers.value({ metadata: { tags: ['a', 'b', 'c'] } })]);
      kefirHelpers.send(docData, [kefirHelpers.value({ metadata: { tags: ['a', 'b', 'c'] } })]);
      kefirHelpers.send(docData, [kefirHelpers.value({ metadata: { tags: ['a', 'b', 'c'] } })]);
      kefirHelpers.send(docData, [kefirHelpers.value({ metadata: { tags: ['a', 'b'] } })]);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, { tags: ['a', 'b'] });
      expect(callback).toHaveBeenNthCalledWith(2, { tags: ['a', 'b', 'c'] });
      expect(callback).toHaveBeenNthCalledWith(3, { tags: ['a', 'b'] });
    });
  });

  describe('fields', () => {
    it('returns an object of with fields keyed by field-ids', () => {
      const result = entryApi.fields;
      expect(result).toMatchSnapshot();
    });
  });

  describe('tasksAPI', () => {
    it('passes arguments through to CMA with added entry ID', () => {
      ['getTasks', 'getTask', 'updateTask', 'deleteTask'].forEach((method) => {
        entryApi[method]('arg-1', 'arg-2');
        expect(cma[method]).toHaveBeenCalledWith('example', 'arg-1', 'arg-2');
      });
    });

    it('transforms user link when creating a Task', () => {
      const payload = { assignedToId: 'a-user' } as any;
      entryApi.createTask(payload);

      expect(cma.createTask).toHaveBeenCalledWith('example', {
        assignedTo: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: 'a-user',
          },
        },
      });
    });
  });

  describe('metaData', () => {
    const metadata = {
      example: 'metadata',
    };
    beforeEach(() => {
      (doc.getValueAt as jest.Mock).mockReturnValueOnce(metadata);

      entryApi = createEntryApi({
        cma,
        internalContentType,
        doc,
        setInvalid,
        fieldLocaleListeners: {},
        widgetId: 'my-app',
        widgetNamespace: WidgetNamespace.APP,
      });
    });
    it('returns the metaData from doc', () => {
      const result = entryApi.metadata;
      expect(result).toEqual(metadata);
    });
  });
});
