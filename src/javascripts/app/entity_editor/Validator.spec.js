import * as K from '../../../../test/utils/kefir';
import { createBase } from 'app/entity_editor/Validator';
import { createDocumentMock } from '../../../../test/utils/createDocumentMock';

describe('app/entity_editor/Validator', () => {
  let schemaErrors;
  let validator;
  const createDocument = createDocumentMock().create;

  const getErrorIds = function () {
    return K.getValue(validator.errors$).map((e) => e.id);
  };
  beforeEach(async function () {
    schemaErrors = jest.fn();
    validator = createBase((_error) => '', { errors: schemaErrors }, createDocument());
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
