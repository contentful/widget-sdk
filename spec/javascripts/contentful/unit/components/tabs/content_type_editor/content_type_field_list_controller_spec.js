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
            {id: 'foo', name: 'Foo'},
            {id: 'bar', name: 'Bar', disabled: true}
          ]
        }
      };
      scope.preferences = {};
    });

    it('should turn showDisabledFields on when a disabled field has an error', function () {
      expect(scope.preferences.showDisabledFields).toBeFalsy();
      scope.validationResult = {errors: [ {path: ['fields', 1]} ]};
      scope.$apply();
      expect(scope.preferences.showDisabledFields).toBe(true);
    });
  });

  describe('UIID', function () {
    beforeEach(function () {
      scope.contentType = {
        data: {
          fields: [
            {id: 'foo'},
            {id: 'bar', uiid: 'aaa'}
          ]
        }
      };
    });

    it('should create and return uiids for fields that don\'t have one', function () {
      scope.$apply();
      expect(scope.fieldList[0].uiid).toBeTruthy();
    });

    it('should not create, just return uiids for fields that already have one', function () {
      scope.$apply();
      expect(scope.fieldList[1].uiid).toBe('aaa');
    });

    describe('otDoc coming online', function () {
      beforeEach(function () {
        scope.contentType = {
          data: {
            fields: [
              {id: 'foo'},
              {id: 'bar', uiid: 'aaa'}
            ]
          },

        };
        scope.otUpdateEntity = sinon.stub();
        scope.$apply();
        scope.otDoc = {
          setAt: sinon.stub().yields(null)
        };
      });
      it('should create uiids for all fields that don\'t have uiids', function () {
        scope.$apply();
        expect(scope.otDoc.setAt.calledOnce).toBe(true);
        expect(scope.otDoc.setAt.calledWith()).toBe(true);
        expect(scope.otUpdateEntity.calledOnce).toBe(true);
      });
    });

    //describe('editing a field should end up in the entity for generated fields'); //fieldsettingscontroller: toggle, fieldType, updateFieldId
  });

  // teste hasUIID
  // teste fieldIsPublished

});
