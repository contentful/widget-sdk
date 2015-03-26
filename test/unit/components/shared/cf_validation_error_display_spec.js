'use strict';

describe('ErrorPathController', function () {
  var controller, scope, attrs;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($controller, $rootScope){
    scope = $rootScope;
    scope.entity = {};
    scope.validationResult = {
      errors : [],
      data: scope.entity
    };
    controller = $controller('ErrorPathController', {
      $scope: $rootScope,
      $attrs: attrs = {}
    });
  }));

  describe('"size" error message', function () {
    beforeEach(function () {
      attrs.cfErrorPath = '["foo", "bar"]';
      scope.entity = {
        foo: {
          bar: null
        }
      };
      scope.validationResult.data = scope.entity;
      scope.validationResult.errors.push({
        name: 'size',
        path: ['foo', 'bar'],
        min: 10
      });
    });

    it('shows error for string data', function () {
      scope.entity.foo.bar = 'asdasd';
      scope.$apply();
      expect(controller.messages[0])
      .toBe('Please expand the text so it\'s no shorter than 10 characters');
    });

    it('shows error for array data', function () {
      scope.entity.foo.bar = [1,2,3];
      scope.$apply();
      expect(controller.messages[0])
      .toBe('Please provide at least 10 items');
    });
  });

  describe('Errors in items', function () {
    beforeEach(function () {
      attrs.cfErrorPath = '["foo", "bars", "*"]';
      scope.entity = {
        foo: {
          bars: ['asdasd', 'asdasd','asdasd']
        }
      };
      scope.validationResult.data = scope.entity;
    });

    it('builds size error message', function () {
      scope.validationResult.errors.push({
        name: 'size',
        path: ['foo', 'bars'],
        min: 10
      });
      scope.$apply();
      expect(controller.messages)
      .toEqual(['Please provide at least 10 items']);
    });

    it('shows custom error message', function () {
      scope.validationResult.errors.push({
        name: 'size',
        path: ['foo', 'bars'],
        customMessage: 'CUSTOM MESSAGE',
        min: 10
      });
      scope.$apply();
      expect(controller.messages).toEqual(['CUSTOM MESSAGE']);
    });

    it('falls back to "details" property', function () {
      scope.validationResult.errors.push({
        name: 'this is an unknown validation',
        path: ['foo', 'bars'],
        details: 'DETAILS'
      });
      scope.$apply();
      expect(controller.messages).toEqual(['DETAILS']);
    });

    it('falls back to error name property', function () {
      scope.validationResult.errors.push({
        name: 'this is an unknown validation',
        path: ['foo', 'bars'],
      });
      scope.$apply();
      expect(controller.messages)
      .toEqual(['Error: this is an unknown validation']);
    });

    it('shows errors in sub-path', function () {
      scope.validationResult.errors.push({
        name: 'size',
        path: ['foo', 'bars', 1],
        min: 10
      });
      scope.$apply();
      expect(controller.messages)
      .toEqual(['Please expand the text so it\'s no shorter than 10 characters']);
    });
  });
});
