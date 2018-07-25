'use strict';

describe('cfFieldErrorsFor', () => {
  beforeEach(module('cf.forms', fieldErrorMessageProvider => {
    fieldErrorMessageProvider.add('a', 'the a error');
  }));

  beforeEach(function () {
    const $compile = this.$inject('$compile');
    const template =
      '<form>' +
        '<input name="myfield" ng-model="myfield">' +
        '<ul cf-field-errors-for="myfield"></ul>' +
      '</form>';
    const element = $compile(template)(this.$inject('$rootScope'));
    this.errorList = element.find('ul');
    this.modelController = element.find('input').controller('ngModel');
    this.$apply();
  });

  it('hides the element when there are no errors', function () {
    expect(this.errorList.hasClass('ng-hide')).toBe(true);

    this.modelController.$setValidity('a', false);
    this.modelController.hideErrors = false;
    this.$apply();
    expect(this.errorList.hasClass('ng-hide')).toBe(false);

    this.modelController.$setValidity('a', true);
    this.$apply();
    expect(this.errorList.hasClass('ng-hide')).toBe(true);
  });

  it('hides the element when input has not been touched', function () {
    this.modelController.$setValidity('a', false);

    this.$apply();
    expect(this.errorList.hasClass('ng-hide')).toBe(true);

    this.modelController.$dirty = true;
    this.$apply();
    expect(this.errorList.hasClass('ng-hide')).toBe(false);
  });

  it('renders error messages', function () {
    this.modelController.$setValidity('a', false);
    this.modelController.$setValidity('b', false);
    this.$apply();
    const errorMessages = this.errorList.find('li').map((i, e) => $(e).text()).get();
    expect(errorMessages).toEqual([
      'the a error', 'Error: b'
    ]);
  });

  it('renders error message from error details', function () {
    this.modelController.$setValidity('a', false);
    this.modelController.errorDetails = {
      a: {message: 'my custom message'}
    };
    this.$apply();
    expect(this.errorList.text()).toEqual('my custom message');
  });

});
