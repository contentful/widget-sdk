'use strict';

describe('cfOnSubmit', function () {
  beforeEach(module('cf.forms'));

  beforeEach(function () {
    var $compile = this.$inject('$compile');
    this.scope = this.$inject('$rootScope').$new();

    var template = '<form cf-on-submit="submit()">';
    this.formElement = $compile(template)(this.scope);
    this.formController = this.formElement.controller('form');
  });

  describe('form.submit()', function () {
    it('sets showErrors to true', function () {
      expect(this.formController.showErrors).toBeUndefined();
      this.formController.submit();
      expect(this.formController.showErrors).toBe(true);
    });

    it('evaluates the attribute expression', function () {
      this.scope.submit = sinon.stub();
      this.formController.submit();
      this.$apply();
      sinon.assert.calledOnce(this.scope.submit);
    });
  });

});

describe('cfFormSubmit', function () {
  beforeEach(module('cf.forms'));

  beforeEach(function () {
    var $compile = this.$inject('$compile');
    this.scope = this.$inject('$rootScope').$new();

    var template =
      '<form cf-on-submit="submit()">' +
        '<button cf-form-submit>' +
      '</form>';
    this.element = $compile(template)(this.scope);
    this.button = this.element.find('button');
    this.form = this.element.controller('form');
  });

  it('calls form.submit() when clicked', function () {
    this.scope.submit = sinon.stub();
    this.button.click();
    this.$apply();
    sinon.assert.calledOnce(this.scope.submit);
  });
});
