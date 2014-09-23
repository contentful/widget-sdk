'use strict';

describe('Field Settings Controller', function () {
  var controller, scope;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($controller, $rootScope) {
      scope = $rootScope.$new();

      scope.field = {};

      controller = $controller('FieldSettingsController', {$scope: scope});
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('display field enabled', function() {
    it('if field type is symbol', function() {
      scope.field.type = 'Symbol';
      scope.$digest();
      expect(scope.displayEnabled(scope.field)).toBeTruthy();
    });

    it('if field type is text', function() {
      scope.field.type = 'Text';
      scope.$digest();
      expect(scope.displayEnabled(scope.field)).toBeTruthy();
    });

    it('if field type is something else', function() {
      scope.field.type = 'Array';
      scope.$digest();
      expect(scope.displayEnabled(scope.field)).toBeFalsy();
    });
  });

  describe('displayed field name', function() {
    it('is empty', function() {
      scope.field.name = '';
      scope.$digest();
      expect(scope.displayedFieldName(scope.field)).toMatch(/untitled/i);
    });

    it('is empty but has id', function() {
      scope.field.name = '';
      scope.field.id = '123';
      scope.$digest();
      expect(scope.displayedFieldName(scope.field)).toMatch(/id/i);
    });

    it('is not empty', function() {
      scope.field.name = 'fieldname';
      scope.$digest();
      expect(scope.displayedFieldName(scope.field)).toBe('fieldname');
    });
  });


});
