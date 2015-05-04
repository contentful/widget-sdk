'use strict';

describe('ngModel directive', function () {
  beforeEach(module('cf.forms'));

  describe('aria-invalid attribute', function () {
    it('is link to model errors', function () {
      var $compile = this.$inject('$compile');
      var scope = this.$inject('$rootScope').$new();

      var template = '<input required ng-model=myvalue>';
      var element = $compile(template)(scope);
      expect(element.attr('aria-invalid')).toBeUndefined();

      element.val('').trigger('change');
      expect(element.attr('aria-invalid')).toBe('true');

      element.val('x').trigger('change');
      expect(element.attr('aria-invalid')).toBe('false');
    });
  });

  describe('ngModelChange event', function () {
    it('is emitted when view value chanbes', function () {
      var $compile = this.$inject('$compile');
      var scope = this.$inject('$rootScope').$new();

      var eventListener = sinon.stub();
      scope.$on('ngModelChange', eventListener);

      var template = '<input type=text ng-model=myvalue>';
      var element = $compile(template)(scope);
      element.val('x').trigger('change');
      sinon.assert.calledOnce(eventListener);
      var data = eventListener.firstCall.args[1];
      expect(data.value).toEqual('x');
    });
  });
});
