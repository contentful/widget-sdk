'use strict';

describe('Validation Error Display Controller', function () {
  var controller, scope, attrs;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($controller, $rootScope){
    scope = $rootScope;
    scope.entity = {};
    scope.validationResult = {
      errors : [],
      data: scope.entity
    };
    controller = $controller('CfValidationErrorDisplayCtrl', {
      $scope: $rootScope,
      $attrs: attrs = {}
    });
  }));

  describe('data-dependent message generation', function () {
    beforeEach(function () {
      attrs.cfErrorPath = '["foo", "bar"]';
      scope.entity = {
        foo: {
          bar: 'asdasd'
        }
      };
      scope.validationResult.data = scope.entity;
      scope.validationResult.errors.push({
        name: 'size',
        path: ['foo', 'bar'],
        min: 10
      });
    });

    it('should say "Length" for strings', function () {
      scope.entity.foo.bar = 'asdasd';
      scope.$apply();
      expect(scope.errorMessages[0]).toBe('Length must be at least 10.');
    });

    it('should say "Size" for strings', function () {
      scope.entity.foo.bar = [1,2,3];
      scope.$apply();
      expect(scope.errorMessages[0]).toBe('Size must be at least 10.');
    });
  });
});
