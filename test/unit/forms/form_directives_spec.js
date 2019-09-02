import sinon from 'sinon';
import { $initialize, $inject, $apply } from 'test/helpers/helpers';

describe('cfOnSubmit', () => {
  beforeEach(async function() {
    await $initialize(this.system);

    const $compile = $inject('$compile');
    this.scope = $inject('$rootScope').$new();

    const template = '<form cf-on-submit="submit()">';
    this.formElement = $compile(template)(this.scope);
    this.formController = this.formElement.controller('form');
  });

  describe('form.submit()', () => {
    it('sets showErrors to true', function() {
      expect(this.formController.showErrors).toBeUndefined();
      this.formController.submit();
      expect(this.formController.showErrors).toBe(true);
    });

    it('evaluates the attribute expression', function() {
      this.scope.submit = sinon.stub();
      this.formController.submit();
      $apply();
      sinon.assert.calledOnce(this.scope.submit);
    });
  });
});

describe('cfFormSubmit', () => {
  beforeEach(async function() {
    await $initialize(this.system);
    const $compile = $inject('$compile');
    this.scope = $inject('$rootScope').$new();

    const template = '<form cf-on-submit="submit()">' + '<button cf-form-submit>' + '</form>';
    this.element = $compile(template)(this.scope);
    this.button = this.element.find('button');
    this.form = this.element.controller('form');
  });

  it('calls form.submit() when clicked', function() {
    this.scope.submit = sinon.stub();
    this.button.click();
    $apply();
    sinon.assert.calledOnce(this.scope.submit);
  });
});
