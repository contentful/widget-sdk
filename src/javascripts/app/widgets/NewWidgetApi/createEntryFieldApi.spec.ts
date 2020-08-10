import { EntryFieldAPI } from 'contentful-ui-extensions-sdk';
import { createEntryFieldApi } from './createEntryFieldApi';
import { InternalContentTypeField } from './createContentTypeApi';
import { onValueWhile } from 'core/utils/kefir';
import { Document } from 'app/entity_editor/Document/typesDocument';

jest.mock('core/utils/kefir', () => {
  const originalModule = jest.requireActual('core/utils/kefir');

  return {
    ...originalModule,
    onValueWhile: jest.fn(),
  };
});

jest.mock('services/localeStore', () => {
  const originalModule = jest.requireActual('services/localeStore');

  return {
    ...originalModule.default,
    getDefaultLocale: jest.fn(() => ({ internal_code: 'internalCode', code: 'en-US' })), // eslint-disable-line @typescript-eslint/camelcase
    getPrivateLocales: jest.fn(() => [
      { internal_code: 'internalCode', code: 'en-US' }, // eslint-disable-line @typescript-eslint/camelcase
      { internal_code: 'anotherInternalCode', code: 'en-GB' }, // eslint-disable-line @typescript-eslint/camelcase
    ]),
  };
});

describe('createEntryFieldApi', () => {
  const otDoc = ({
    changes: {
      filter: jest.fn(),
    },
    getValueAt: jest.fn(),
    setValueAt: jest.fn(),
    removeValueAt: jest.fn(),
    permissions: {
      canEditFieldLocale: jest.fn(),
    },
  } as unknown) as Document;

  const listenToFieldLocaleEvent = jest.fn();

  const internalField = ({
    apiName: 'apiname',
    id: 'internal_id',
    localized: false,
    required: false,
    validations: [],
    type: 'Symbol',
  } as unknown) as InternalContentTypeField;

  const buildApi = (internalField: InternalContentTypeField) =>
    createEntryFieldApi({
      internalField,
      otDoc,
      setInvalid: jest.fn(),
      listenToFieldLocaleEvent,
    });

  describe('id', () => {
    describe('When apiName is present', () => {
      it('is apiName', () => {
        const entryFieldApi = buildApi(internalField);
        expect(entryFieldApi.id).toEqual(internalField.apiName);
      });
    });

    describe('When apiName is missing', () => {
      it('is internalId', () => {
        const { apiName, ...rest } = internalField;
        const entryFieldApi = buildApi(rest as InternalContentTypeField);
        expect(entryFieldApi.id).toEqual(internalField.id);
      });
    });
  });

  describe('locales', () => {
    describe('when the internal field is localized', () => {
      it('returns all locale codes', () => {
        const entryFieldApi = buildApi({ ...internalField, localized: true });
        expect(entryFieldApi.locales).toEqual(['en-US', 'en-GB']);
      });
    });

    describe('when the internal field is not localized', () => {
      it('returns the default locale code', () => {
        const entryFieldApi = buildApi({ ...internalField, localized: false });
        expect(entryFieldApi.locales).toEqual(['en-US']);
      });
    });
  });

  describe('type', () => {
    it('is set to items from the internal field', () => {
      const type = 'example';
      const entryFieldApi = buildApi({ ...internalField, type });
      expect(entryFieldApi.type).toEqual(type);
    });
  });

  describe('required', () => {
    it('is set to items from the internal field', () => {
      const required = false;
      const entryFieldApi = buildApi({ ...internalField, required });
      expect(entryFieldApi.required).toEqual(required);
    });
  });

  describe('validations', () => {
    describe('when internalField has validations', () => {
      it('are equal', () => {
        const validations = [{ example: 'validation' }];
        const entryFieldApi = buildApi({ ...internalField, validations });
        expect(entryFieldApi.validations).toEqual(validations);
      });
    });

    describe('when internalField is missing validations', () => {
      it('an empty array is return', () => {
        const { validations, ...rest } = internalField;
        const entryFieldApi = buildApi(rest as InternalContentTypeField);
        expect(entryFieldApi.validations).toEqual([]);
      });
    });
  });

  describe('items', () => {
    it('is set to items from internal field', () => {
      const items = { type: 'Symbol' };
      const entryFieldApi = buildApi({ ...internalField, items });
      expect(entryFieldApi.items).toEqual(items);
    });
  });

  describe('getValue', () => {
    it('returns the current value', () => {
      const currentValue = 'this is the current value';
      (otDoc.getValueAt as jest.Mock).mockReturnValueOnce({
        fields: {
          // eslint-disable-next-line @typescript-eslint/camelcase
          internal_id: {
            internalCode: currentValue,
          },
        },
      });

      const entryFieldApi = buildApi(internalField);

      const result = entryFieldApi.getValue();
      expect(result).toEqual(currentValue);
    });

    describe('setValue', () => {
      describe('when the value cannot be edited', () => {
        it('throws', () => {
          (otDoc.permissions.canEditFieldLocale as jest.Mock).mockReturnValue(false);

          const entryFieldApi = buildApi(internalField);

          return expect(entryFieldApi.setValue('a new value')).rejects.toThrow();
        });
      });

      describe('when the value can be edited', () => {
        it('sets the value', async () => {
          (otDoc.permissions.canEditFieldLocale as jest.Mock).mockReturnValue(true);

          const entryFieldApi = buildApi(internalField);

          await entryFieldApi.setValue('a new value');

          expect(otDoc.setValueAt).toHaveBeenCalledWith(
            ['fields', 'internal_id', 'internalCode'],
            'a new value'
          );
        });
      });
    });

    describe('removeValue', () => {
      describe('when the value cannot be edited', () => {
        it('throws', () => {
          (otDoc.permissions.canEditFieldLocale as jest.Mock).mockReturnValue(false);

          const entryFieldApi = buildApi(internalField);

          return expect(entryFieldApi.removeValue('a new value')).rejects.toThrow();
        });
      });

      describe('when the value can be edited', () => {
        it('removes the value', async () => {
          (otDoc.permissions.canEditFieldLocale as jest.Mock).mockReturnValue(true);

          const entryFieldApi = buildApi(internalField);

          await entryFieldApi.removeValue();

          expect(otDoc.removeValueAt).toHaveBeenCalledWith([
            'fields',
            'internal_id',
            'internalCode',
          ]);
        });
      });
    });
  });

  describe('onValueChanged', () => {
    it('passed callback will be called on changes', () => {
      const currentValue = 'value';
      (otDoc.getValueAt as jest.Mock).mockReturnValueOnce({
        fields: {
          // eslint-disable-next-line @typescript-eslint/camelcase
          internal_id: {
            internalCode: currentValue,
          },
        },
      });

      const entryFieldApi = buildApi(internalField);

      const callback = jest.fn();

      entryFieldApi.onValueChanged(callback);
      (onValueWhile as jest.Mock).mock.calls[0][2]();

      expect(callback).toHaveBeenCalledWith(currentValue);
    });
  });

  describe('onIsDisabledChanged', () => {
    describe('passed callback and field data to listenToFieldLocaleEvent', () => {
      let entryFieldApi: EntryFieldAPI;
      let callback: jest.Mock;
      beforeEach(() => {
        entryFieldApi = buildApi(internalField);

        callback = jest.fn();

        entryFieldApi.onIsDisabledChanged(callback);
      });

      it('calls listenToFieldLocaleEvent with internal field and locale', () => {
        expect(listenToFieldLocaleEvent.mock.calls[0][0]).toEqual(internalField);
        expect(listenToFieldLocaleEvent.mock.calls[0][1]).toEqual({
          internal_code: 'internalCode', // eslint-disable-line @typescript-eslint/camelcase
          code: 'en-US',
        });
      });

      it('calls listenToFieldLocaleEvent with a callback that returns fieldLocale.access', () => {
        expect(listenToFieldLocaleEvent.mock.calls[0][2]({ access$: 'result' })).toEqual('result');
      });

      it('calls listenToFieldLocaleEvent with a callback that calls the passed callback', () => {
        listenToFieldLocaleEvent.mock.calls[0][3]({ disabled: false });
        expect(callback).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('getForLocale', () => {
    it('returns a FieldAPI for a specific locale', () => {
      const entryFieldApi = buildApi(internalField);

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
});
