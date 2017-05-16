import * as K from 'helpers/mocks/kefir';

describe('entityEditor/Validator', function () {
  beforeEach(function () {
    module('contentful/test');

    const Validator = this.$inject('entityEditor/Validator');
    this.schemaErrors = sinon.stub();
    this.validator = Validator.create(
      (_error) => '',
      {errors: this.schemaErrors},
      () => this.data
    );
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
      K.assertCurrentValue(this.validator.errors$, errors);

      this.validator.run();
      setError('UnresolvedLinks');
      K.assertCurrentValue(this.validator.errors$, errors);

      this.validator.run();
      setError('InvalidEntry', 'Validation error');
      K.assertCurrentValue(this.validator.errors$, errors);

      const current = [{id: 'INITIAL', path: [], message: ''}];
      this.schemaErrors.returns(current);
      this.validator.run();
      setError('VersionMismatch');
      K.assertCurrentValue(this.validator.errors$, current);
    });
  });
});
