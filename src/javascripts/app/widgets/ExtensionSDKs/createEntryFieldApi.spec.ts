import { createEntryFieldApi } from './createEntryFieldApi';
import { InternalContentTypeField } from './createContentTypeApi';
import { onValueWhile } from 'core/utils/kefir';
import type { Document } from '@contentful/editorial-primitives';
import * as Analytics from 'analytics/Analytics';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';

jest.mock('core/utils/kefir', () => {
  const originalModule = jest.requireActual('core/utils/kefir');

  return {
    ...originalModule,
    onValueWhile: jest.fn(),
    getValue: jest.fn((arg) => arg),
  };
});

jest.mock('services/localeStore', () => {
  const originalModule = jest.requireActual('services/localeStore');

  return {
    ...originalModule.default,
    getDefaultLocale: jest.fn(() => ({ internal_code: 'internalCode', code: 'en-US' })),
    getPrivateLocales: jest.fn(() => [
      { internal_code: 'internalCode', code: 'en-US' },
      { internal_code: 'anotherInternalCode', code: 'en-GB' },
    ]),
  };
});

jest.mock('analytics/Analytics', () => {
  return {
    track: jest.fn(),
  };
});

const defaultDoc = {
  changes: {
    filter: jest.fn(),
  },
  getValueAt: jest.fn(),
  setValueAt: jest.fn(),
  removeValueAt: jest.fn(),
  permissions: {
    canEditFieldLocale: jest.fn(),
  },
  sysProperty: {
    contentType: { sys: { id: 'content-type-id' } },
    id: 'entry-id',
  },
} as unknown as jest.Mocked<Document>;

const defaultInternalField = {
  apiName: 'apiname',
  id: 'internal_id',
  localized: false,
  required: false,
  validations: [],
  type: 'Symbol',
} as unknown as InternalContentTypeField;

const buildEntryFieldApi = ({
  internalField = defaultInternalField,
  readOnly = false,
  doc = defaultDoc,
  setInvalid = jest.fn(),
  fieldLocaleListeners = {},
  ...rest
}: any = {}) => {
  return createEntryFieldApi({
    internalField,
    doc,
    setInvalid,
    fieldLocaleListeners,
    readOnly,
    ...rest,
  });
};

describe('createEntryFieldApi', () => {
  describe('id', () => {
    describe('When apiName is present', () => {
      it('is apiName', () => {
        const entryFieldApi = buildEntryFieldApi();
        expect(entryFieldApi.id).toEqual(defaultInternalField.apiName);
      });
    });

    describe('When apiName is missing', () => {
      it('is internalId', () => {
        const { apiName, ...rest } = defaultInternalField;
        const entryFieldApi = buildEntryFieldApi({ internalField: rest });
        expect(entryFieldApi.id).toEqual(defaultInternalField.id);
      });
    });
  });

  describe('locales', () => {
    describe('when the internal field is localized', () => {
      it('returns all locale codes', () => {
        const entryFieldApi = buildEntryFieldApi({
          internalField: { ...defaultInternalField, localized: true },
        });
        expect(entryFieldApi.locales).toEqual(['en-US', 'en-GB']);
      });
    });

    describe('when the internal field is not localized', () => {
      it('returns the default locale code', () => {
        const entryFieldApi = buildEntryFieldApi({ ...defaultInternalField, localized: false });
        expect(entryFieldApi.locales).toEqual(['en-US']);
      });
    });
  });

  describe('type', () => {
    it('is set to items from the internal field', () => {
      const type = 'example';
      const entryFieldApi = buildEntryFieldApi({
        internalField: { ...defaultInternalField, type },
      });
      expect(entryFieldApi.type).toEqual(type);
    });
  });

  describe('required', () => {
    it('is set to items from the internal field', () => {
      const required = false;
      const entryFieldApi = buildEntryFieldApi({ ...defaultInternalField, required });
      expect(entryFieldApi.required).toEqual(required);
    });
  });

  describe('validations', () => {
    describe('when internalField has validations', () => {
      it('are equal', () => {
        const validations = [{ example: 'validation' }];
        const entryFieldApi = buildEntryFieldApi({
          internalField: { ...defaultInternalField, validations },
        });
        expect(entryFieldApi.validations).toEqual(validations);
      });
    });

    describe('when internalField is missing validations', () => {
      it('an empty array is return', () => {
        const { validations, ...rest } = defaultInternalField;
        const entryFieldApi = buildEntryFieldApi({
          defaultInternalField: rest as InternalContentTypeField,
        });
        expect(entryFieldApi.validations).toEqual([]);
      });
    });
  });

  describe('items', () => {
    it('is set to items from internal field', () => {
      const items = { type: 'Symbol' };
      const entryFieldApi = buildEntryFieldApi({
        internalField: { ...defaultInternalField, items },
      });
      expect(entryFieldApi.items).toEqual(items);
    });
  });

  describe('getValue', () => {
    it('returns the current value', () => {
      const currentValue = 'this is the current value';
      (defaultDoc.getValueAt as jest.Mock).mockReturnValueOnce({
        fields: {
          internal_id: {
            internalCode: currentValue,
          },
        },
      });

      const entryFieldApi = buildEntryFieldApi();

      const result = entryFieldApi.getValue();
      expect(result).toEqual(currentValue);
    });
  });

  describe('setValue', () => {
    describe('when the value cannot be edited', () => {
      it('throws', () => {
        (defaultDoc.permissions.canEditFieldLocale as jest.MockedFunction<any>).mockReturnValue(
          false
        );

        const entryFieldApi = buildEntryFieldApi();

        return expect(entryFieldApi.setValue('a new value')).rejects.toThrow();
      });
    });

    describe('when the value can be edited', () => {
      it('sets the value', async () => {
        (defaultDoc.permissions.canEditFieldLocale as jest.MockedFunction<any>).mockReturnValue(
          true
        );

        const entryFieldApi = buildEntryFieldApi({
          widgetId: 'my-app',
          widgetNamespace: WidgetNamespace.APP,
        });

        await entryFieldApi.setValue('a new value');

        expect(defaultDoc.setValueAt).toHaveBeenCalledWith(
          ['fields', 'internal_id', 'internalCode'],
          'a new value'
        );
        expect(Analytics.track).toHaveBeenCalled();
      });
    });

    describe('when api is read-only', () => {
      it('throws a ReadOnlyEntryFieldAPI exception', () => {
        const entryFieldApi = buildEntryFieldApi({ readOnly: true });

        expect(() => entryFieldApi.setValue('whatever')).toThrowError(
          makeReadOnlyApiError(ReadOnlyApi.EntryField)
        );
      });
    });
  });

  describe('removeValue', () => {
    describe('when the value cannot be edited', () => {
      it('throws', () => {
        (defaultDoc.permissions.canEditFieldLocale as jest.MockedFunction<any>).mockReturnValue(
          false
        );

        const entryFieldApi = buildEntryFieldApi();

        return expect(entryFieldApi.removeValue('a new value')).rejects.toThrow();
      });
    });

    describe('when the value can be edited', () => {
      it('removes the value', async () => {
        (defaultDoc.permissions.canEditFieldLocale as jest.MockedFunction<any>).mockReturnValue(
          true
        );

        const entryFieldApi = buildEntryFieldApi();

        await entryFieldApi.removeValue();

        expect(defaultDoc.removeValueAt).toHaveBeenCalledWith([
          'fields',
          'internal_id',
          'internalCode',
        ]);
      });
    });

    describe('when api is read-only', () => {
      it('throws a ReadOnlyEntryFieldAPI exception', () => {
        const entryFieldApi = buildEntryFieldApi({ readOnly: true });

        expect(() => entryFieldApi.removeValue()).toThrowError(
          makeReadOnlyApiError(ReadOnlyApi.EntryField)
        );
      });
    });
  });

  describe('onValueChanged', () => {
    it('passed callback will be called on changes', () => {
      const currentValue = 'value';
      (defaultDoc.getValueAt as jest.Mock).mockReturnValueOnce({
        fields: {
          internal_id: {
            internalCode: currentValue,
          },
        },
      });

      const entryFieldApi = buildEntryFieldApi({
        internalField: defaultInternalField,
        doc: defaultDoc,
      });

      const callback = jest.fn();

      entryFieldApi.onValueChanged(callback);
      (onValueWhile as jest.Mock).mock.calls[0][2]();

      expect(callback).toHaveBeenCalledWith(currentValue);
    });
  });

  describe('onIsDisabledChanged', () => {
    it('attaches passed callback to field locale listener', () => {
      const onDisabledChanged = jest.fn();
      const entryFieldApi = buildEntryFieldApi({
        fieldLocaleListeners: { apiname: { 'en-US': { onDisabledChanged } } },
      });

      const callback = jest.fn();

      entryFieldApi.onIsDisabledChanged(callback);

      onDisabledChanged.mock.calls[0][0](false);

      expect(callback).toHaveBeenCalledWith(false);
    });
  });

  describe('getForLocale', () => {
    it('returns a FieldAPI for a specific locale', () => {
      const entryFieldApi = buildEntryFieldApi();

      const fieldAPI = entryFieldApi.getForLocale('en-US');

      expect(fieldAPI).toMatchObject({
        id: 'apiname',
        locale: 'en-US',
        type: 'Symbol',
        required: false,
        validations: [],
        items: undefined,
        getValue: expect.any(Function),
        setValue: expect.any(Function),
        removeValue: expect.any(Function),
        onValueChanged: expect.any(Function),
        onIsDisabledChanged: expect.any(Function),
        onSchemaErrorsChanged: expect.any(Function),
        setInvalid: expect.any(Function),
      });
    });
  });

  describe('setInvalid', () => {
    describe('when api is read-only', () => {
      it('throws a ReadOnlyEntryFieldAPI exception', () => {
        const entryFieldApi = buildEntryFieldApi({ readOnly: true });

        expect(() => entryFieldApi.getForLocale('en').setInvalid(false)).toThrowError(
          makeReadOnlyApiError(ReadOnlyApi.EntryField)
        );
      });
    });
  });
});
