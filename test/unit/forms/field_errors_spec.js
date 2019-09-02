import $ from 'jquery';
import { $initialize, $inject, $apply } from 'test/helpers/helpers';

describe('cfFieldErrorsFor', () => {
  beforeEach(async function() {
    await $initialize(this.system);

    const $compile = $inject('$compile');
    const template =
      '<form>' +
      '<input name="myfield" ng-model="myfield">' +
      '<ul cf-field-errors-for="myfield"></ul>' +
      '</form>';
    const element = $compile(template)($inject('$rootScope'));
    this.errorList = element.find('ul');
    this.modelController = element.find('input').controller('ngModel');
    $apply();
  });

  it('hides the element when there are no errors', function() {
    expect(this.errorList.hasClass('ng-hide')).toBe(true);

    this.modelController.$setValidity('a', false);
    this.modelController.hideErrors = false;
    $apply();
    expect(this.errorList.hasClass('ng-hide')).toBe(false);

    this.modelController.$setValidity('a', true);
    $apply();
    expect(this.errorList.hasClass('ng-hide')).toBe(true);
  });

  it('hides the element when input has not been touched', function() {
    this.modelController.$setValidity('a', false);

    $apply();
    expect(this.errorList.hasClass('ng-hide')).toBe(true);

    this.modelController.$dirty = true;
    $apply();
    expect(this.errorList.hasClass('ng-hide')).toBe(false);
  });

  it('renders error messages', function() {
    this.modelController.$setValidity('a', false);
    this.modelController.$setValidity('b', false);
    $apply();
    const errorMessages = this.errorList
      .find('li')
      .map((_, e) => $(e).text())
      .get();
    expect(errorMessages).toEqual(['Error: a', 'Error: b']);
  });

  it('renders error message from error details', function() {
    this.modelController.$setValidity('a', false);
    this.modelController.errorDetails = {
      a: { message: 'my custom message' }
    };
    $apply();
    expect(this.errorList.text()).toEqual('my custom message');
  });
});
