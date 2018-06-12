'use strict';

describe('ngModel directive', () => {
  beforeEach(module('cf.forms'));

  describe('aria-invalid attribute', () => {
    it('is link to model errors', function () {
      var $compile = this.$inject('$compile');
      var scope = this.$inject('$rootScope').$new();

      var template = '<input required ng-model=myvalue>';
      var element = $compile(template)(scope);
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
    beforeEach(function () {
      var $compile = this.$inject('$compile');
      var scope = this.$inject('$rootScope').$new();

      var template = '<form><input required ng-model=myvalue></form>';
      this.form = $compile(template)(scope);
      this.modelController = this.form.find('input').controller('ngModel');
      this.formController = this.form.controller('form');
    });

    it('is set to true initially', function () {
      expect(this.modelController.hideErrors).toBe(true);
    });

    it('is set to false after the input changed', function () {
      this.form.find('input').val('jo').trigger('change');
      expect(this.modelController.hideErrors).toBe(false);
    });

    it('is set to false if the form forces errors', function () {
      this.formController.showErrors = true;
      this.$apply();
      expect(this.modelController.hideErrors).toBe(false);
    });
  });

  describe('ngModel:update event', () => {
    it('is emitted when view value changes', function () {
      var $compile = this.$inject('$compile');
      var scope = this.$inject('$rootScope').$new();

      var eventListener = sinon.stub();
      scope.$on('ngModel:update', eventListener);

      var template = '<input type=text ng-model=myvalue>';
      var element = $compile(template)(scope);
      element.val('x').trigger('change');
      sinon.assert.calledOnce(eventListener);
      var modelCtrl = eventListener.firstCall.args[1];
      expect(modelCtrl.$viewValue).toEqual('x');
    });
  });

  describe('ngModel:commit event', () => {
    it('is emitted when input is blured', function () {
      var $compile = this.$inject('$compile');
      var scope = this.$inject('$rootScope').$new();

      var eventListener = sinon.stub();
      scope.$on('ngModel:commit', eventListener);

      var template = '<input type=text ng-model=myvalue>';
      var element = $compile(template)(scope);
      element.trigger('blur');
      sinon.assert.calledOnce(eventListener);
    });
  });
});
