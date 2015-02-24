'use strict';

describe('cfObjectEditor', function () {
  var scope, elem, textarea;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('otBindModel');
    });

    inject(function ($rootScope, $compile, $q) {
      $rootScope.otEditable = true;
      $rootScope.fieldData = {value: null};
      $rootScope.otChangeValue = sinon.stub().returns($q.when());
      elem = $compile('<div cf-object-editor ng-model="fieldData.value"></div>')($rootScope);
      textarea = elem.find('textarea');
      scope = elem.scope();
      scope.$apply();
    });
  });

  describe('internal data', function () {
    it('should turn blank strings into undefined', function () {
      textarea.val('');
      textarea.trigger('input');
      expect(scope.jsonData.value).toBe(undefined);
      expect(textarea).toHaveClass('ng-valid-json');

      textarea.val('\n    \n   \t  \n');
      textarea.trigger('input');
      expect(scope.jsonData.value).toBe(undefined);
      expect(textarea).toHaveClass('ng-valid-json');
    });

    it('should turn invalid json into undefined', function () {
      textarea.val('{a: undefined}');
      textarea.trigger('input');
      expect(scope.jsonData.value).toBe(undefined);
    });

    it('should mark textarea invalid when json invalid', function () {
      textarea.val('{a: undefined}');
      textarea.trigger('input');
      expect(textarea).toHaveClass('ng-invalid-json');
    });

    it('should format json properly', function () {
      scope.fieldData.value = {a: 1};
      scope.$apply();
      expect(textarea.val()).toBe('{\n  "a": 1\n}');
    });
  });

  it('should properly set data to the parsed JSON', function () {
    textarea.val('{"a": 1}');
    textarea.trigger('input');
    expect(scope.jsonData.value).toLookEqual({a:1});
    expect(scope.fieldData.value).toBe(null);
    elem.find('button').eq(0).click();
    expect(scope.fieldData.value).toLookEqual({a:1});
  });

  it('should format json after submitting', function () {
    textarea.val('{"a": 1}');
    textarea.trigger('input');
    elem.find('button').eq(0).click();
    expect(textarea.val()).toBe('{\n  "a": 1\n}');
  });

  it('should reset pristine and valid after cancelling', function () {
    textarea.val('aaa');
    textarea.trigger('input');
    expect(scope.textFieldModel.$dirty).toBe(true);
    expect(scope.textFieldModel.$invalid).toBe(true);
    elem.find('button').eq(1).click();
    expect(scope.textFieldModel.$dirty).toBe(false);
    expect(scope.textFieldModel.$invalid).toBe(false);
  });

  describe('button behavior', function () {
    it('should disable the buttons on invalid values', function () {
      textarea.val('aaa');
      textarea.trigger('input');
      expect(elem.find('button').eq(0).filter(':disabled').length).toBe(1);
    });

    it('should show warning on invalid values', function () {
      expect(elem.find('span')).toBeNgHidden();
      textarea.val('aaa');
      textarea.trigger('input');
      expect(elem.find('span')).not.toBeNgHidden();
    });

    it('should show the buttons after I type', function () {
      expect(elem.find('button.ng-hide').length).toBe(2);
      textarea.val('aaa');
      textarea.trigger('input');
      expect(elem.find('button.ng-hide').length).toBe(0);
    });

    it('should remove the buttons when I submit', function () {
      textarea.val('aaa');
      textarea.trigger('input');
      expect(elem.find('button.ng-hide').length).toBe(0);
      elem.find('button').eq(0).click();
      expect(elem.find('button.ng-hide').length).toBe(2);
    });

    it('should reset everything on incoming change', function () {
      textarea.val('{}');
      textarea.trigger('input');
      expect(elem.find('button.ng-hide').length).toBe(0);
      scope.fieldData.value = {foo: 'bar'};
      scope.$apply();
      expect(elem.find('button.ng-hide').length).toBe(2);
    });
  });
});
