'use strict';

describe('cfNoForm directive', () => {
  beforeEach(module('cf.forms'));

  beforeEach(function () {
    const $compile = this.$inject('$compile');

    this.$rootScope = this.$inject('$rootScope');
    this.scope = this.$rootScope.$new();

    const template = '<form name="myform">' +
                     '<input name="no-dirty" ng-model="x" cf-no-form>' +
                     '<input name="dirty" ng-model="y">' +
                   '</form>';
    this.element = $compile(template)(this.scope);
  });

  it('does not set the form to dirty', function () {
    const form = this.scope.myform;

    this.element.find('[name=no-dirty]').trigger('change');
    expect(form.$dirty).toBe(false);

    this.element.find('[name=dirty]').trigger('change');
    expect(form.$dirty).toBe(true);
  });

  it('does not propagate the update event', function () {
    const listener = sinon.spy();
    this.$rootScope.$on('ngModel:update', listener);
    this.$rootScope.$on('ngModel:commit', listener);

    this.element.find('[name=no-dirty]').trigger('change').trigger('blur');
    sinon.assert.notCalled(listener);

    this.element.find('[name=dirty]').trigger('change').trigger('blur');
    sinon.assert.calledTwice(listener);
  });
});
