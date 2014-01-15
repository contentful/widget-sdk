'use strict';

describe('cfObjectEditor', function () {
  var scope, elem;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('otBindModel');
    });

    inject(function ($rootScope, $compile) {
      scope = $rootScope;
      scope.otEditable = true;
      scope.fieldData = {value: null};
      elem = $compile('<div class="cf-object-editor"></div>')($rootScope);
    });
  });

  it('should turn blank strings into undefined', function () {
    elem.val('');
    elem.trigger('input');
    expect(scope.fieldData.value).toBe(undefined);
    expect(elem).toHaveClass('ng-valid-json');

    elem.val('\n    \n   \t  \n');
    elem.trigger('input');
    expect(scope.fieldData.value).toBe(undefined);
    expect(elem).toHaveClass('ng-valid-json');
  });

  it('should turn invalid json into undefined', function () {
    elem.val('{a: undefined}');
    elem.trigger('input');
    expect(scope.fieldData.value).toBe(undefined);
  });

  it('should mark textarea invalid when json invalid', function () {
    elem.val('{a: undefined}');
    elem.trigger('input');
    expect(elem).toHaveClass('ng-invalid-json');
  });

  it('should format json properly', function () {
    scope.fieldData.value = {a: 1};
    scope.$digest();
    expect(elem.val()).toBe('{\n  "a": 1\n}');
  });
});
