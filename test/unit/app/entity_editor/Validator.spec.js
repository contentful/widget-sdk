import * as K from 'test/helpers/mocks/kefir';
import { create as createDocument } from 'test/helpers/mocks/entity_editor_document';

describe('app/entity_editor/Validator.es6', () => {
  beforeEach(function() {
    module('contentful/test');

    const Validator = this.$inject('app/entity_editor/Validator.es6');
    this.schemaErrors = sinon.stub();
    this.validator = Validator.createBase(
      _error => '',
      { errors: this.schemaErrors },
      createDocument()
    );

    this.getErrorIds = function() {
      return K.getValue(this.validator.errors$).map(e => e.id);
    };
  });

  describe('#setApiResponseErrors', () => {
    it('includes only API validation errors', function() {
      this.schemaErrors.returns([]);
      const errors = [{ id: 'EID', path: [], message: '' }];

      const setError = (id, message) => {
        this.validator.setApiResponseErrors({
          data: {
            sys: { id: id },
            message: message,
            details: {
              errors: errors
            }
          }
        });
      };

      this.validator.run();
      setError('ValidationFailed');
      expect(this.getErrorIds()).toEqual(['EID']);

      this.validator.run();
      setError('UnresolvedLinks');
      expect(this.getErrorIds()).toEqual(['EID']);

      this.validator.run();
      setError('InvalidEntry', 'Validation error');
      expect(this.getErrorIds()).toEqual(['EID']);

      // validator.run() removes API errors
      const current = [{ id: 'INITIAL', path: [], message: '' }];
      this.schemaErrors.returns(current);
      this.validator.run();
      setError('VersionMismatch');
      expect(this.getErrorIds()).toEqual(['INITIAL']);
    });
  });

  describe('#validateFieldLocale', () => {
    it('it only updates errors on specified field', function() {
      // Initial errors
      this.schemaErrors.returns([
        { id: 'THIS BEFORE', path: ['fields', 'FID-1', 'LOCALE'] },
        { id: 'OTHER BEFORE', path: ['fields', 'FID-2', 'LOCALE'] }
      ]);
      this.validator.run();
      expect(this.getErrorIds()).toEqual(['THIS BEFORE', 'OTHER BEFORE']);

      // New errors. Validate only specified field
      this.schemaErrors.returns([
        { id: 'THIS AFTER', path: ['fields', 'FID-1', 'LOCALE'] },
        { id: 'OTHER AFTER', path: ['fields', 'FID-2', 'LOCALE'] }
      ]);
      this.validator.validateFieldLocale('FID-1', 'LOCALE');

      expect(this.getErrorIds()).toEqual(['THIS AFTER', 'OTHER BEFORE']);
    });

    it('removes the entire field-errors', function() {
      // Initial errors
      this.schemaErrors.returns([
        { id: 'THIS BEFORE', path: ['fields', 'FID-1'] },
        { id: 'OTHER BEFORE', path: ['fields', 'FID-2', 'LOCALE'] }
      ]);
      this.validator.run();
      expect(this.getErrorIds()).toEqual(['THIS BEFORE', 'OTHER BEFORE']);

      // New errors. Validate only specified field
      this.schemaErrors.returns([{ id: 'OTHER AFTER', path: ['fields', 'FID-2', 'LOCALE'] }]);
      this.validator.validateFieldLocale('FID-1', 'LOCALE');

      expect(this.getErrorIds()).toEqual(['OTHER BEFORE']);
    });
  });
});
