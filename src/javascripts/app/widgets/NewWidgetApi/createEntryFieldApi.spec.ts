import { EntryFieldAPI } from 'contentful-ui-extensions-sdk';
import {
  createEntryFieldApi,
  CreateEntryFieldApiProps,
  InternalField,
} from './createEntryFieldApi';
import { onValueWhile } from 'core/utils/kefir';
import { Document } from 'app/entity_editor/Document/typesDocument';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';

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
    getDefaultLocale: jest.fn(() => ({ internal_code: 'internalCode', code: 'en-US' })),
    getPrivateLocales: jest.fn(() => [
      { internal_code: 'internalCode', code: 'en-US' },
      { internal_code: 'anotherInternalCode', code: 'en-GB' },
    ]),
  };
});

const getCreateEntryFieldApiProps = (props): CreateEntryFieldApiProps => {
  return {
    internalField: {},
    listenToFieldLocaleEvent: () => jest.fn(),
    otDoc: {},
    setInvalid: jest.fn(),
    readOnly: false,
    ...props,
  };
};

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
  } as unknown) as jest.Mocked<Document>;

  const listenToFieldLocaleEvent = jest.fn();

  const internalField = {
    apiName: 'apiname',
    id: 'internal_id',
    localized: false,
    required: false,
    validations: [],
    type: 'Symbol',
  };

  describe('id', () => {
    describe('When apiName is present', () => {
      it('is apiName', () => {
        const entryFieldApi = createEntryFieldApi(
          getCreateEntryFieldApiProps({
            internalField,
          })
        );
        expect(entryFieldApi.id).toEqual(internalField.apiName);
      });
    });

    describe('When apiName is missing', () => {
      it('is internalId', () => {
        const { apiName, ...rest } = internalField;
        const entryFieldApi = createEntryFieldApi(
          getCreateEntryFieldApiProps({
            internalField: rest,
          })
        );
        expect(entryFieldApi.id).toEqual(internalField.id);
      });
    });
  });

  describe('locales', () => {
    describe('when the internal field is localized', () => {
      it('returns all locale codes', () => {
        const entryFieldApi = createEntryFieldApi(
          getCreateEntryFieldApiProps({
            internalField: { ...internalField, localized: true },
          })
        );
        expect(entryFieldApi.locales).toEqual(['en-US', 'en-GB']);
      });
    });

    describe('when the internal field is not localized', () => {
      it('returns the default locale code', () => {
        const entryFieldApi = createEntryFieldApi(
          getCreateEntryFieldApiProps({
            internalField: { ...internalField, localized: false },
          })
        );
        expect(entryFieldApi.locales).toEqual(['en-US']);
      });
    });
  });

  describe('type', () => {
    it('is set to items from the internal field', () => {
      const type = 'example';
      const entryFieldApi = createEntryFieldApi(
        getCreateEntryFieldApiProps({
          internalField: { ...internalField, type },
        })
      );
      expect(entryFieldApi.type).toEqual(type);
    });
  });

  describe('required', () => {
    it('is set to items from the internal field', () => {
      const required = false;
      const entryFieldApi = createEntryFieldApi(
        getCreateEntryFieldApiProps(
          getCreateEntryFieldApiProps({
            internalField: { ...internalField, required },
          })
        )
      );
      expect(entryFieldApi.required).toEqual(required);
    });
  });

  describe('validations', () => {
    describe('when internalField has validations', () => {
      it('are equal', () => {
        const validations = [{ example: 'validation' }];
        const entryFieldApi = createEntryFieldApi(
          getCreateEntryFieldApiProps({
            internalField: { ...internalField, validations },
          })
        );
        expect(entryFieldApi.validations).toEqual(validations);
      });
    });

    describe('when internalField is missing validations', () => {
      it('an empty array is return', () => {
        const { validations, ...rest } = internalField;
        const entryFieldApi = createEntryFieldApi(
          getCreateEntryFieldApiProps({
            internalField: rest as InternalField,
          })
        );
        expect(entryFieldApi.validations).toEqual([]);
      });
    });
  });

  describe('items', () => {
    it('is the internal fields items', () => {
      const items = [{ type: 'Symbol' }];
      const entryFieldApi = createEntryFieldApi(
        getCreateEntryFieldApiProps({
          internalField: { ...internalField, items },
        })
      );
      expect(entryFieldApi.items).toEqual(items);
    });
  });

  describe('getValue', () => {
    it('returns the current value', () => {
      const currentValue = 'this is the current value';
      otDoc.getValueAt.mockReturnValueOnce({
        fields: {
          internal_id: {
            internalCode: currentValue,
          },
        },
      });

      const entryFieldApi = createEntryFieldApi(
        getCreateEntryFieldApiProps({
          internalField,
          otDoc,
        })
      );

      const result = entryFieldApi.getValue();
      expect(result).toEqual(currentValue);
    });
  });

  describe('setValue', () => {
    describe('when the value cannot be edited', () => {
      it('throws', () => {
        (otDoc.permissions.canEditFieldLocale as jest.MockedFunction<any>).mockReturnValue(false);

        const entryFieldApi = createEntryFieldApi(
          getCreateEntryFieldApiProps({
            internalField,
            otDoc,
          })
        );

        expect(entryFieldApi.setValue('a new value')).rejects.toThrow();
      });
    });

    describe('when the value can be edited', () => {
      it('changes the value', async () => {
        (otDoc.permissions.canEditFieldLocale as jest.MockedFunction<any>).mockReturnValue(true);

        const entryFieldApi = createEntryFieldApi(
          getCreateEntryFieldApiProps({
            internalField,
            otDoc,
          })
        );

        await entryFieldApi.setValue('a new value');

        expect(otDoc.setValueAt).toHaveBeenCalledWith(
          ['fields', 'internal_id', 'internalCode'],
          'a new value'
        );
      });
    });

    describe('when api is read-only', () => {
      it('throws a ReadOnlyEntryFieldAPI exception', () => {
        const entryFieldApi = createEntryFieldApi(getCreateEntryFieldApiProps({ readOnly: true }));

        expect(() => entryFieldApi.setValue('whatever')).toThrowError(
          makeReadOnlyApiError(ReadOnlyApi.EntryField)
        );
      });
    });
  });

  describe('removeValue', () => {
    describe('when the value cannot be edited', () => {
      it('throws', () => {
        (otDoc.permissions.canEditFieldLocale as jest.MockedFunction<any>).mockReturnValue(false);

        const entryFieldApi = createEntryFieldApi(
          getCreateEntryFieldApiProps({
            internalField,
            otDoc,
          })
        );

        expect(entryFieldApi.removeValue('a new value')).rejects.toThrow();
      });
    });

    describe('when the value can be edited', () => {
      it('sets the value', async () => {
        (otDoc.permissions.canEditFieldLocale as jest.MockedFunction<any>).mockReturnValue(true);

        const entryFieldApi = createEntryFieldApi(
          getCreateEntryFieldApiProps({
            internalField,
            otDoc,
          })
        );

        await entryFieldApi.removeValue();

        expect(otDoc.removeValueAt).toHaveBeenCalledWith(['fields', 'internal_id', 'internalCode']);
      });
    });

    describe('when api is read-only', () => {
      it('throws a ReadOnlyEntryFieldAPI exception', () => {
        const entryFieldApi = createEntryFieldApi(getCreateEntryFieldApiProps({ readOnly: true }));

        expect(() => entryFieldApi.removeValue()).toThrowError(
          makeReadOnlyApiError(ReadOnlyApi.EntryField)
        );
      });
    });
  });

  describe('onValueChanged', () => {
    it('passed callback will be called on changes', () => {
      const currentValue = 'value';
      otDoc.getValueAt.mockReturnValueOnce({
        fields: {
          internal_id: {
            internalCode: currentValue,
          },
        },
      });

      const entryFieldApi = createEntryFieldApi(
        getCreateEntryFieldApiProps({
          internalField,
          otDoc,
        })
      );

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
        entryFieldApi = createEntryFieldApi(
          getCreateEntryFieldApiProps({
            internalField,
            otDoc,
            listenToFieldLocaleEvent,
          })
        );

        callback = jest.fn();

        entryFieldApi.onIsDisabledChanged(callback);
      });

      it('calls listenToFieldLocaleEvent with internal field and locale', () => {
        expect(listenToFieldLocaleEvent.mock.calls[0][0]).toEqual(internalField);
        expect(listenToFieldLocaleEvent.mock.calls[0][1]).toEqual({
          internal_code: 'internalCode',
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
      const entryFieldApi = createEntryFieldApi(
        getCreateEntryFieldApiProps({
          internalField,
          otDoc,
          listenToFieldLocaleEvent,
        })
      );

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
        const entryFieldApi = createEntryFieldApi(getCreateEntryFieldApiProps({ readOnly: true }));

        expect(() => entryFieldApi.getForLocale('en').setInvalid(false)).toThrowError(
          makeReadOnlyApiError(ReadOnlyApi.EntryField)
        );
      });
    });
  });
});
