import * as K from 'helpers/mocks/kefir';

describe('app/entity_editor/Validator', function () {
  beforeEach(function () {
    module('contentful/test');
    const MockDocument = this.$inject('mocks/entityEditor/Document');

    const Validator = this.$inject('app/entity_editor/Validator');
    this.schemaErrors = sinon.stub();
    this.validator = Validator.createBase(
      (_error) => '',
      {errors: this.schemaErrors},
      MockDocument.create()
    );

    this.getErrorIds = function () {
      return K.getValue(this.validator.errors$).map((e) => e.id);
    };
  });

  describe('#setApiResponseErrors', function () {
    it('includes only API validation errors', function () {
      this.schemaErrors.returns([]);
      const errors = [{id: 'EID', path: [], message: ''}];

      const setError = (id, message) => {
        this.validator.setApiResponseErrors({
          data: {
            sys: {id: id},
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
      const current = [{id: 'INITIAL', path: [], message: ''}];
      this.schemaErrors.returns(current);
      this.validator.run();
      setError('VersionMismatch');
      expect(this.getErrorIds()).toEqual(['INITIAL']);
    });
  });
});
