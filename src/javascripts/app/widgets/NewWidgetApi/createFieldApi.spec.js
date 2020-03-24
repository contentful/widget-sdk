import { createFieldApi } from './createFieldApi';
import { identity, set } from 'lodash';
import { onValueWhile, onValueScope } from 'utils/kefir';

jest.mock('utils/kefir', () => ({
  onValueWhile: jest.fn().mockImplementation((_lifeline, stream, onChange) => {
    return onChange(stream);
  }),
  onValueScope: jest.fn().mockImplementation((_scope, stream, onChange) => {
    return onChange(stream);
  })
}));

describe('widgets/NewWidgetApi/createFieldApi', () => {
  function createScopeMock(modify = identity) {
    return modify({
      locale: {
        code: 'en-US',
        default: true,
        internal_code: 'en-US-internal',
        name: 'English (United States)',
        optional: false
      },
      widget: {
        field: {
          apiName: 'title',
          id: 'HockMXw5PPwYzhkb',
          required: false,
          type: 'Symbol',
          validations: [{ size: { min: 0, max: 123 } }]
        }
      },
      fieldController: {
        setInvalid: jest.fn()
      },
      fieldLocale: {},
      otDoc: {
        setValueAt: jest.fn(),
        removeValueAt: jest.fn(),
        getValueAt: jest.fn(),
        permissions: {
          canEditFieldLocale: jest.fn().mockReturnValue(true)
        }
      }
    });
  }

  it('should return FieldAPI compatible object', () => {
    expect(createFieldApi({ $scope: createScopeMock() })).toMatchInlineSnapshot(`
                  Object {
                    "getValue": [Function],
                    "id": "title",
                    "items": Array [],
                    "locale": "en-US",
                    "onIsDisabledChanged": [Function],
                    "onSchemaErrorsChanged": [Function],
                    "onValueChanged": [Function],
                    "removeValue": [Function],
                    "required": false,
                    "setInvalid": [Function],
                    "setValue": [Function],
                    "type": "Symbol",
                    "validations": Array [
                      Object {
                        "size": Object {
                          "max": 123,
                          "min": 0,
                        },
                      },
                    ],
                  }
            `);
  });

  describe('#getValue', () => {
    it('should read a value from otDoc', () => {
      const $scope = createScopeMock();

      $scope.otDoc.getValueAt.mockImplementation(() => {
        return {
          fields: {
            [$scope.widget.field.id]: {
              [$scope.locale.internal_code]: 'value'
            }
          }
        };
      });

      const fieldApi = createFieldApi({ $scope });

      expect(fieldApi.getValue()).toEqual('value');
      expect($scope.otDoc.getValueAt).toHaveBeenCalledTimes(1);
      expect($scope.otDoc.getValueAt).toHaveBeenCalledWith([]);
    });
  });

  describe('#setValue', () => {
    it('should set a value to otDoc', async () => {
      const $scope = createScopeMock();

      $scope.otDoc.setValueAt.mockImplementation((_path, value) => {
        return Promise.resolve(value);
      });

      const fieldApi = createFieldApi({ $scope });

      expect(await fieldApi.setValue('value')).toEqual('value');
      expect($scope.otDoc.setValueAt).toHaveBeenCalledTimes(1);
      expect($scope.otDoc.setValueAt).toHaveBeenCalledWith(
        ['fields', $scope.widget.field.id, $scope.locale.internal_code],
        'value'
      );
    });

    it('should handle errors properly', async () => {
      const $scope = createScopeMock();

      $scope.otDoc.setValueAt.mockImplementation(() => {
        return Promise.reject();
      });

      const fieldApi = createFieldApi({ $scope });

      await expect(fieldApi.setValue('value')).rejects.toMatchInlineSnapshot(
        `[Error: Could not update entry field]`
      );

      expect($scope.otDoc.setValueAt).toHaveBeenCalledTimes(1);
      expect($scope.otDoc.setValueAt).toHaveBeenCalledWith(
        ['fields', $scope.widget.field.id, $scope.locale.internal_code],
        'value'
      );
    });
  });

  describe('#removeValue', () => {
    it('should remove a value from otDoc', async () => {
      const $scope = createScopeMock();

      $scope.otDoc.removeValueAt.mockImplementation(() => {
        return Promise.resolve();
      });

      const fieldApi = createFieldApi({ $scope });

      await fieldApi.removeValue();
      expect($scope.otDoc.removeValueAt).toHaveBeenCalledTimes(1);
      expect($scope.otDoc.removeValueAt).toHaveBeenCalledWith([
        'fields',
        $scope.widget.field.id,
        $scope.locale.internal_code
      ]);
    });

    it('should handle errors properly', async () => {
      const $scope = createScopeMock();

      $scope.otDoc.removeValueAt.mockImplementation(() => {
        return Promise.reject();
      });

      const fieldApi = createFieldApi({ $scope });

      await expect(fieldApi.removeValue()).rejects.toMatchInlineSnapshot(
        `[Error: Could not remove value for field]`
      );

      expect($scope.otDoc.removeValueAt).toHaveBeenCalledTimes(1);
      expect($scope.otDoc.removeValueAt).toHaveBeenCalledWith([
        'fields',
        $scope.widget.field.id,
        $scope.locale.internal_code
      ]);
    });
  });

  describe('#setInvalid', () => {
    it('should trigger a fieldController method', () => {
      const $scope = createScopeMock();

      const fieldApi = createFieldApi({ $scope });

      fieldApi.setInvalid(true);

      expect($scope.fieldController.setInvalid).toHaveBeenCalledWith($scope.locale.code, true);
    });
  });

  describe('#onIsDisabledChanged', () => {
    it('should call a callback when a stream emits a new value', () => {
      const $scope = createScopeMock(mock => {
        return set(mock, ['fieldLocale', 'access$'], {
          disabled: true
        });
      });

      const fieldApi = createFieldApi({ $scope });

      const callback = jest.fn();

      fieldApi.onIsDisabledChanged(callback);

      expect(onValueScope).toHaveBeenCalledWith(
        $scope,
        $scope.fieldLocale.access$,
        expect.any(Function)
      );
      expect(callback).toHaveBeenCalledWith(true);
    });
  });

  describe('#onSchemaErrorsChanged', () => {
    it('should call a callback when a stream emits a new value', () => {
      const $scope = createScopeMock(mock => {
        return set(mock, ['fieldLocale', 'errors$'], ['some error']);
      });

      const fieldApi = createFieldApi({ $scope });

      const callback = jest.fn();

      fieldApi.onSchemaErrorsChanged(callback);

      expect(onValueScope).toHaveBeenCalledWith(
        $scope,
        $scope.fieldLocale.errors$,
        expect.any(Function)
      );
      expect(callback).toHaveBeenCalledWith(['some error']);
    });
  });

  describe('#onValueChanged', () => {
    it('should call a callback when a stream emits a new value', () => {
      const $scope = createScopeMock(scope => {
        return set(
          scope,
          ['otDoc', 'changes'],
          [
            ['fields', scope.widget.field.id, scope.locale.internal_code, '123'],
            ['fields', scope.widget.field.id, 'some-other-locale-code', '521']
          ]
        );
      });

      $scope.otDoc.getValueAt.mockImplementation(() => {
        return {
          fields: {
            [$scope.widget.field.id]: {
              [$scope.locale.internal_code]: 'value'
            }
          }
        };
      });

      const fieldApi = createFieldApi({ $scope });

      const callback = jest.fn();

      fieldApi.onValueChanged(callback);

      expect(onValueWhile).toHaveBeenCalledWith(
        $scope.otDoc.changes,
        [['fields', $scope.widget.field.id, $scope.locale.internal_code, '123']],
        expect.any(Function)
      );
      expect($scope.otDoc.getValueAt).toHaveBeenCalledWith([]);
      expect(callback).toHaveBeenCalledWith('value');
    });
  });
});
