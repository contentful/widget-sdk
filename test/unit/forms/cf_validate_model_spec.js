'use strict';

describe('cfValidateModel directive', () => {
  beforeEach(function () {
    module('contentful/test', $provide => {
      $provide.constant('$timeout', fn => {
        fn();
      });
    });

    const $compile = this.$inject('$compile');

    const $rootScope = this.$inject('$rootScope');

    const template =
      '<div cf-validate="data">' +
        '<input ng-model="data.x" cf-validate-model="x">' +
      '</div>';

    this.element = $compile(template)($rootScope);
    this.scope = this.element.scope();

    this.scope.schema = {errors: sinon.stub()};

    this.ngModel = this.element.find('input').controller('ngModel');

    this.validator = this.scope.validator;
    sinon.spy(this.validator, 'run');

    this.commitValue = function () {
      this.scope.$emit('ngModel:update');
      this.$apply();
    };
  });

  it('validates on input ngModel:update', function () {
    this.scope.$emit('ngModel:update');
    this.$apply();
    sinon.assert.calledOnce(this.validator.run);
    sinon.assert.calledWith(this.validator.run, 'x', true);
  });

  it('sets validity according to schema errors', function () {
    // initial error
    this.scope.schema.errors.returns([
      {name: 'e', path: ['x']}
    ]);
    this.commitValue();
    expect(this.ngModel.$error).toEqual({e: true});

    // replace path error
    this.scope.schema.errors.returns([
      {name: 'f', path: ['x']}
    ]);
    this.commitValue();
    expect(this.ngModel.$error).toEqual({f: true});

    // remove path error
    this.scope.schema.errors.returns([
      {name: 'e', path: ['y']}
    ]);
    this.commitValue();
    expect(this.ngModel.$error).toEqual({});
  });

  it('adds error details', function () {
    this.scope.schema.errors.returns([
      {name: 'e', path: ['x']}
    ]);
    this.commitValue();
    expect(this.ngModel.errorDetails).toEqual({
      e: {name: 'e', path: ['x']}
    });
  });
});
