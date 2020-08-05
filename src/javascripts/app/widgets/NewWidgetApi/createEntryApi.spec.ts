import { createEntryApi } from './createEntryApi';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { EntryAPI } from 'contentful-ui-extensions-sdk';
import { constant } from 'kefir';
import { onValue } from 'core/utils/kefir';

jest.mock('services/localeStore', () => {
  const originalModule = jest.requireActual('services/localeStore');

  return {
    ...originalModule,
    getDefaultLocale: () => ({ internal_code: 'internalCode', code: 'en-US' }),
  };
});

jest.mock('core/utils/kefir', () => {
  const originalModule = jest.requireActual('core/utils/kefir');

  return {
    ...originalModule,
    onValue: jest.fn(),
  };
});

const mockField = {
  disabled: false,
  localized: false,
  omitted: false,
  required: false,
  type: 'Symbol',
  validations: [],
};

describe('createEntryApi', () => {
  let entryApi: EntryAPI;
  const internalContentType = {
    sys: {
      type: 'something',
      id: 'someid',
    },
    fields: [
      { ...mockField, id: 'field_one', name: 'the first field' },
      { ...mockField, id: 'field_two', name: 'the second field' },
    ],
    name: 'content_type',
    description: 'a content type',
    displayField: '',
  };
  const otDoc = ({
    getValueAt: jest.fn(),
    sysProperty: constant({ id: 'example' }),
  } as unknown) as Document;
  const setInvalid = jest.fn();
  const listenToFieldLocaleEvent = jest.fn();
  beforeEach(() => {
    entryApi = createEntryApi({
      internalContentType,
      otDoc,
      setInvalid,
      listenToFieldLocaleEvent,
    });
  });

  describe('getSys', () => {
    it('returns sys from otdoc', () => {
      const result = entryApi.getSys();
      expect(result).toEqual({ id: 'example' });
    });
  });

  describe('onSysChange', () => {
    it('cals Kefir onvalue with the callback', () => {
      const callback = jest.fn();
      entryApi.onSysChanged(callback);
      expect(onValue).toHaveBeenCalledWith(otDoc.sysProperty, callback);
    });
  });

  describe('fields', () => {
    it('returns an object of with fields keyed by field-ids', () => {
      const result = entryApi.fields;
      expect(result).toMatchObject({
        field_one: {
          id: 'field_one',
          locales: ['en-US'],
          required: false,
          type: 'Symbol',
          validations: [],
        },
        field_two: {
          id: 'field_two',
        },
      });
    });
  });
});
