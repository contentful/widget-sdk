'use strict';

describe('ngModel directive', () => {
  beforeEach(module('contentful/test'));

  describe('aria-invalid attribute', () => {
    it('is link to model errors', function() {
      const $compile = this.$inject('$compile');
      const scope = this.$inject('$rootScope').$new();

      const template = '<input required ng-model=myvalue>';
      const element = $compile(template)(scope);
      expect(element.attr('aria-invalid')).toBeUndefined();

      this.$apply();
      expect(element.attr('aria-invalid')).toBe('false');

      element.val('').trigger('change');
      expect(element.attr('aria-invalid')).toBe('true');

      element.val('x').trigger('change');
      expect(element.attr('aria-invalid')).toBe('false');
    });
  });

  describe('hideErrors property', () => {
    beforeEach(function() {
      const $compile = this.$inject('$compile');
      const scope = this.$inject('$rootScope').$new();

      const template = '<form><input required ng-model=myvalue></form>';
      this.form = $compile(template)(scope);
      this.modelController = this.form.find('input').controller('ngModel');
      this.formController = this.form.controller('form');
    });

    it('is set to true initially', function() {
      expect(this.modelController.hideErrors).toBe(true);
    });

    it('is set to false after the input changed', function() {
      this.form
        .find('input')
        .val('jo')
        .trigger('change');
      expect(this.modelController.hideErrors).toBe(false);
    });

    it('is set to false if the form forces errors', function() {
      this.formController.showErrors = true;
      this.$apply();
      expect(this.modelController.hideErrors).toBe(false);
    });
  });

  describe('ngModel:update event', () => {
    it('is emitted when view value changes', function() {
      const $compile = this.$inject('$compile');
      const scope = this.$inject('$rootScope').$new();

      const eventListener = sinon.stub();
      scope.$on('ngModel:update', eventListener);

      const template = '<input type=text ng-model=myvalue>';
      const element = $compile(template)(scope);
      element.val('x').trigger('change');
      sinon.assert.calledOnce(eventListener);
      const modelCtrl = eventListener.firstCall.args[1];
      expect(modelCtrl.$viewValue).toEqual('x');
    });
  });

  describe('ngModel:commit event', () => {
    it('is emitted when input is blured', function() {
      const $compile = this.$inject('$compile');
      const scope = this.$inject('$rootScope').$new();

      const eventListener = sinon.stub();
      scope.$on('ngModel:commit', eventListener);

      const template = '<input type=text ng-model=myvalue>';
      const element = $compile(template)(scope);
      element.trigger('blur');
      sinon.assert.calledOnce(eventListener);
    });
  });
});
