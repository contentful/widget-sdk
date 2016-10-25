describe('entityEditor/Validator', function () {
  beforeEach(function () {
    module('contentful/test');
    this.K = this.$inject('mocks/kefir');

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
          body: {
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
      this.K.assertCurrentValue(this.validator.errors$, errors);

      this.validator.run();
      setError('UnresolvedLinks');
      this.K.assertCurrentValue(this.validator.errors$, errors);

      this.validator.run();
      setError('InvalidEntry', 'Validation error');
      this.K.assertCurrentValue(this.validator.errors$, errors);

      const current = [{id: 'INITIAL', path: [], message: ''}];
      this.schemaErrors.returns(current);
      this.validator.run();
      setError('VersionMismatch');
      this.K.assertCurrentValue(this.validator.errors$, current);
    });
  });
});
