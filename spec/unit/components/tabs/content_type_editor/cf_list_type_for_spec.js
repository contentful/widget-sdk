'use strict';

describe('cfListTypeFor Directive', function () {
  var element, scope;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, $rootScope) {
    scope = $rootScope;
    scope.field = {};
    scope.list = [];
    element = $compile('<input type="text" ng-model="list" ng-list cf-list-type-for="field" />')(scope);
  }));

  it('should convert numbers to numbers', function () {
    scope.field.type = 'Number';
    element.val('1,2,3.5').trigger('input');
    scope.$apply();
    expect(scope.list).toLookEqual([1,2,3.5]);
  });

  it('should convert integers to integers', function () {
    scope.field.type = 'Integer';
    element.val('1,2,3.5').trigger('input');
    scope.$apply();
    expect(scope.list).toLookEqual([1,2,3]);
  });
});
