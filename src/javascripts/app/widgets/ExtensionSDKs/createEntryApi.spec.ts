import { createEntryApi } from './createEntryApi';
import { InternalContentType } from './createContentTypeApi';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { EntryAPI } from 'contentful-ui-extensions-sdk';
import { constant } from 'kefir';
import { onValue } from 'core/utils/kefir';
import { noop } from 'lodash';

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
  const doc = ({
    getValueAt: jest.fn(),
    sysProperty: constant({ id: 'example' }),
  } as unknown) as Document;
  const setInvalid = noop;
  beforeEach(() => {
    entryApi = createEntryApi({
      internalContentType,
      doc,
      setInvalid,
      fieldLocaleListeners: {},
    });
  });

  describe('getSys', () => {
    it('returns sys from doc', () => {
      const result = entryApi.getSys();
      expect(result).toEqual({ id: 'example' });
    });
  });

  describe('onSysChange', () => {
    it('calls Kefir onvalue with the callback', () => {
      const callback = jest.fn();
      entryApi.onSysChanged(callback);
      expect(onValue).toHaveBeenCalledWith(doc.sysProperty, callback);
    });
  });

  describe('fields', () => {
    it('returns an object of with fields keyed by field-ids', () => {
      const result = entryApi.fields;
      expect(result).toMatchSnapshot();
    });
  });

  describe('metaData', () => {
    const metadata = {
      example: 'metadata',
    };
    beforeEach(() => {
      (doc.getValueAt as jest.Mock).mockReturnValueOnce(metadata);

      entryApi = createEntryApi({
        internalContentType,
        doc,
        setInvalid,
        fieldLocaleListeners: {},
      });
    });
    it('returns the metaData from doc', () => {
      const result = entryApi.metadata;
      expect(result).toEqual(metadata);
    });
  });
});
