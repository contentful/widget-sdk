'use strict';

describe('ContentType FieldList Controller', function () {
  var controller, scope;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, $rootScope, $controller){
    scope = $rootScope;
    controller = $controller('ContentTypeFieldListCtrl', {$scope: $rootScope});
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('Validation errors', function () {
    beforeEach(function () {
      scope.contentType = {
        data: {
          fields: [
            {id: 'foo'},
            {id: 'bar'}
          ]
        }
      };
    });

    it('should forcefully show validations with errors for simple fields', function () {
      expect(scope.showValidations('foo')).toBeFalsy();
      expect(scope.showValidations('bar')).toBeFalsy();
      scope.validationResult = {
        valid: false,
        errors: [{
          path: [
            'fields',
            0,
            'validations'
          ]
        }]
      };
      scope.$apply();
      expect(scope.showValidations('foo')).toBeTruthy();
      expect(scope.showValidations('bar')).toBeFalsy();
    });

    it('should forcefully show validations with errors for simple fields', function () {
      expect(scope.showValidations('foo')).toBeFalsy();
      expect(scope.showValidations('bar')).toBeFalsy();
      scope.validationResult = {
        valid: false,
        errors: [{
          path: [
            'fields',
            0,
            'items',
            'validations'
          ]
        }]
      };
      scope.$apply();
      expect(scope.showValidations('foo')).toBeTruthy();
      expect(scope.showValidations('bar')).toBeFalsy();
    });
  });

  describe('UIID', function () {
    it('should create and return uiids for fields that don\'t have one');
    it('should not create, just return uiids for fields that already have one');
  });

});
