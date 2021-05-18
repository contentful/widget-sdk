import * as K from '__mocks__/kefirMock';
import { createBase } from 'app/entity_editor/Validator';
import { createDocumentMock } from './Document/__mocks__/createDocumentMock';
import noop from 'lodash/noop';

describe('app/entity_editor/Validator', () => {
  let schemaErrors;
  let validator;
  const createDocument = createDocumentMock().create;

  const getErrorIds = function () {
    return K.getValue(validator.errors$).map((e) => e.id);
  };
  beforeEach(async function () {
    const entity = {
      sys: {
        id: 'EID',
        type: 'Entry',
        version: 42,
      },
      fields: { 'FID-1': { LOCALE: '' }, 'FID-2': { LOCALE: '' } },
    };
    schemaErrors = jest.fn().mockReturnValue([]);
    validator = createBase(
      (_error) => '',
      { errors: schemaErrors },
      createDocument(
        entity,
        {},
        noop,
        [{ id: 'FID-1' }, { id: 'FID-2' }],
        [{ internal_code: 'LOCALE' }]
      )
    );
  });

  describe('#setApiResponseErrors', () => {
    it('includes only API validation errors', function () {
      schemaErrors.mockReturnValue([]);
      const errors = [{ id: 'EID', path: [], message: '' }];

      const setError = (id, message) => {
        validator.setApiResponseErrors({
          data: {
            sys: { id: id },
            message: message,
            details: {
              errors: errors,
            },
          },
        });
      };

      validator.run();
      setError('ValidationFailed');
      expect(getErrorIds()).toEqual(['EID']);

      validator.run();
      setError('UnresolvedLinks');
      expect(getErrorIds()).toEqual(['EID']);

      validator.run();
      setError('InvalidEntry', 'Validation error');
      expect(getErrorIds()).toEqual(['EID']);

      // validator.run() removes API errors
      const current = [{ id: 'INITIAL', path: [], message: '' }];
      schemaErrors.mockReturnValue(current);
      validator.run();
      setError('VersionMismatch');
      expect(getErrorIds()).toEqual(['INITIAL']);
    });
  });

  describe('#validateFieldLocale', () => {
    it('it only updates errors on specified field', function () {
      // Initial errors
      schemaErrors.mockReturnValue([
        { id: 'THIS BEFORE', path: ['fields', 'FID-1', 'LOCALE'] },
        { id: 'OTHER BEFORE', path: ['fields', 'FID-2', 'LOCALE'] },
      ]);
      validator.run();
      expect(getErrorIds()).toEqual(['THIS BEFORE', 'OTHER BEFORE']);

      // New errors. Validate only specified field
      schemaErrors.mockReturnValue([
        { id: 'THIS AFTER', path: ['fields', 'FID-1', 'LOCALE'] },
        { id: 'OTHER AFTER', path: ['fields', 'FID-2', 'LOCALE'] },
      ]);
      validator.validateFieldLocale('FID-1', 'LOCALE');

      expect(getErrorIds()).toEqual(['THIS AFTER', 'OTHER BEFORE']);
    });

    it('removes the entire field-errors', function () {
      // Initial errors
      schemaErrors.mockReturnValue([
        { id: 'THIS BEFORE', path: ['fields', 'FID-1'] },
        { id: 'OTHER BEFORE', path: ['fields', 'FID-2', 'LOCALE'] },
      ]);
      validator.run();
      expect(getErrorIds()).toEqual(['THIS BEFORE', 'OTHER BEFORE']);

      // New errors. Validate only specified field
      schemaErrors.mockReturnValue([{ id: 'OTHER AFTER', path: ['fields', 'FID-2', 'LOCALE'] }]);
      validator.validateFieldLocale('FID-1', 'LOCALE');

      expect(getErrorIds()).toEqual(['OTHER BEFORE']);
    });
  });
});
