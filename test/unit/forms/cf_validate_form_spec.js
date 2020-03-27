import _ from 'lodash';
import sinon from 'sinon';
import { $initialize, $inject, $apply } from 'test/utils/ng';

describe('cfValidateForm directive', () => {
  beforeEach(async function () {
    await $initialize(this.system, ($provide) => {
      $provide.constant('$timeout', (fn) => {
        fn();
      });
    });

    const $compile = $inject('$compile');

    const $rootScope = $inject('$rootScope');

    const template = '<form cf-validate="data" cf-validate-form="a.b">';

    this.element = $compile(template)($rootScope);
    this.scope = this.element.scope();

    this.scope.schema = { errors: sinon.stub() };

    this.form = this.element.controller('form');

    this.validator = this.scope.validator;
    sinon.spy(this.validator, 'run');
  });

  it('validates on input ngModel:update', function () {
    this.scope.$emit('ngModel:update');
    $apply();
    sinon.assert.calledOnce(this.validator.run);
    sinon.assert.calledWith(this.validator.run, 'a.b', true);
  });

  it('exposes path errors on form', function () {
    this.scope.schema.errors.returns([
      { name: '1', path: ['a'] },
      { name: '2', path: ['a', 'b'] },
      { name: '3', path: ['a', 'b', 'c'] },
      { name: '4', path: ['a', 'b', 'c'] },
    ]);
    this.validator.run();
    $apply();
    const errorNames = _.map(this.form.errors, 'name');
    expect(errorNames).toEqual(['2', '3', '4']);
  });

  it('sets form validity', function () {
    expect(this.form.$valid).toBe(true);

    this.scope.schema.errors.returns([{ name: '1', path: ['a', 'b'] }]);
    this.validator.run();
    $apply();

    expect(this.form.$valid).toBe(false);

    this.scope.schema.errors.returns([{ name: '1', path: ['a', 'c'] }]);
    this.validator.run();
    $apply();
    expect(this.form.$valid).toBe(true);
  });
});
