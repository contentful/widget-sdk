'use strict';

describe('cfFieldEditor Controller', function () {
  var scope, createController;
  beforeEach(function () {
    module('contentful/test');
    inject(function ($controller, $rootScope) {
      scope = $rootScope.$new();

      scope.entity = {
        data: {
          fields: {}
        }
      };

      scope.widget = {
        field: { id: 'fieldId' }
      };
      scope.getFieldValidationsOfType = sinon.stub();

      createController = function () {
        $controller('CfFieldEditorController', {$scope: scope, $attrs: {cfEditorEntity: 'entity'}});
        scope.$apply();
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('fieldData is set', function() {
    beforeEach(function() {
      scope.widget.field.type = 'Symbol';
      scope.widget.widgetId = 'textfield';
      scope.entity = {
        data: {
          fields: {
            fieldId: {
              'en-US': 'fieldvalue'
            }
          }
        }
      };

      scope.widget = {
        field : { id: 'fieldId' }
      };

      scope.locale = {
        code: 'en-US'
      };

      createController();
    });

    it('sets fieldData value', function() {
      expect(scope.fieldData.value).toEqual('fieldvalue');
    });

    it('updates fieldData value to same value', function () {
      scope.entity.data.fields.fieldId['en-US'] = 'fieldvalue';
      scope.$digest();
      expect(scope.fieldData.value).toEqual('fieldvalue');
    });

    it('updates fieldData value to current value if both changed', function () {
      scope.entity.data.fields.fieldId['en-US'] = 'newfieldvalue';
      scope.fieldData.value = 'randomfieldvalue';
      scope.$digest();
      expect(scope.fieldData.value).toEqual('randomfieldvalue');
    });

    it('updates fieldData value to new value', function () {
      scope.entity.data.fields.fieldId['en-US'] = 'newfieldvalue';
      scope.$digest();
      expect(scope.fieldData.value).toEqual('newfieldvalue');
    });

    it('updates external entity value', function () {
      scope.fieldData.value = 'updatefrominternal';
      scope.$digest();
      expect(scope.entity.data.fields.fieldId['en-US']).toEqual('updatefrominternal');
    });
  });

  describe('with no fields', function() {
    beforeEach(function() {
      scope.widget.field.type = 'Symbol';
      scope.widget.field.widgetId = 'textfield';
      scope.entity = {
        data: {}
      };

      scope.widget = {field:{}};

      scope.locale = {
        code: 'en-US'
      };

      createController();
    });

    it('does not set fieldData value on init', function() {
      expect(scope.fieldData.value).toBeUndefined();
    });

    it('updates external value on change and creates field', function() {
      scope.fieldData.value = 'newfieldvalue';
      scope.widget.field.id = 'fieldId';
      scope.$digest();
      expect(scope.entity.data.fields.fieldId['en-US']).toBe('newfieldvalue');
    });
  });

  describe('if field does not exist', function() {
    beforeEach(function() {
      scope.widget.field.type = 'Symbol';
      scope.widget.widgetId = 'textfield';
      scope.entity = {
        data: {}
      };

      scope.widget = {field: {id: 'randomfield'}};

      scope.locale = {
        code: 'en-US'
      };

      createController();
    });

    it('does not set fieldData value on init', function() {
      expect(scope.fieldData.value).toBeUndefined();
    });

    it('updates external value on change and creates field', function() {
      scope.fieldData.value = 'newfieldvalue';
      scope.widget.field.id = 'fieldId';
      scope.$digest();
      expect(scope.entity.data.fields.fieldId['en-US']).toBe('newfieldvalue');
    });
  });

});

