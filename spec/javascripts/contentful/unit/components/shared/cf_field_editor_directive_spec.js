'use strict';

describe('cfFieldEditor Directive', function () {
  var element, scope;
  var compileElement, ngSwitch;
  beforeEach(function () {
    function ControllerMock() {}
    module('contentful/test', function ($provide) {
      $provide.stubDirective('otPath', {
        controller: ControllerMock
      });
      $provide.removeDirectives(
        'cfObjectEditor',
        'cfLocationEditor',
        'cfNumberEditor',
        'cfFileEditor',
        'cfDatetimeEditor',
        'cfTokenizedSearch'
      );
    });
    inject(function ($compile, $rootScope) {
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

      compileElement = function () {
        element = $compile('<div ot-path class="cf-field-editor" cf-editor-entity="entity"></div>')(scope);
        scope.$digest();
        ngSwitch = element.find('ng-switch');
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  function makeEditorTypeTests(editorName, elementType, additionalTests) {
    describe('renders a '+editorName+' editor', function() {
      beforeEach(function() {
        scope.widget.widgetType = editorName;
        compileElement();
      });

      it('only has one element', function() {
        expect(ngSwitch.children().length).toBe(1);
      });

      it('element is defined', function () {
        expect(ngSwitch.children().eq(0)).toHaveTagName(elementType);
      });

      if(additionalTests) additionalTests();
    });
  }

  makeEditorTypeTests('singleLine', 'input');

  makeEditorTypeTests('multipleLine', 'textarea');

  makeEditorTypeTests('markdown', 'div', function () {
    it('has class name', function() {
      expect(ngSwitch.children().eq(0)).toHaveClass('cf-markdown-editor');
    });
  });

  // These tests will fail because the radio editor needs additional setup
  // (validations or fieldType boolean) to display labels
  makeEditorTypeTests('radio', 'cf-radio-editor', function () {
    xit('has 2 labels', function() {
      expect(ngSwitch.find('label').length).toBe(2);
    });

    xit('has 2 radio inputs', function() {
      expect(ngSwitch.find('input[type=radio]').length).toBe(2);
    });
  });

  makeEditorTypeTests('datePicker', 'div', function () {
    it('has class name', function() {
      expect(ngSwitch.children().eq(0)).toHaveClass('cf-datetime-editor');
    });
  });

  makeEditorTypeTests('linksEditor', 'div', function () {
    it('has attr name', function() {
      expect(ngSwitch.children().eq(0).attr('cf-link-editor')).toBeDefined();
    });
  });

  makeEditorTypeTests('listInput', 'input', function () {
    it('has attr name', function() {
      expect(ngSwitch.children().eq(0).attr('cf-list-identity-fix')).toBeDefined();
    });
  });

  makeEditorTypeTests('objectEditor', 'div', function () {
    it('has class name', function() {
      expect(ngSwitch.children().eq(0)).toHaveClass('cf-object-editor');
    });
  });

  makeEditorTypeTests('locationEditor', 'div', function () {
    it('has class name', function() {
      expect(ngSwitch.children().eq(0)).toHaveClass('cf-location-editor');
    });
  });

  makeEditorTypeTests('numberEditor', 'div', function () {
    it('has class name', function() {
      expect(ngSwitch.children().eq(0)).toHaveClass('cf-number-editor');
    });
  });

  makeEditorTypeTests('linkEditor', 'div', function () {
    it('has attr name', function() {
      expect(ngSwitch.children().eq(0).attr('cf-link-editor')).toBeDefined();
    });
  });

  makeEditorTypeTests('fileEditor', 'div', function () {
    it('has class name', function() {
      expect(ngSwitch.children().eq(0)).toHaveClass('cf-file-editor');
    });
  });

  describe('fieldData is set', function() {
    beforeEach(function() {
      scope.widget.field.type = 'Symbol';
      scope.widget.widgetType = 'textfield';
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

      compileElement();
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
      scope.widget.field.widgetType = 'textfield';
      scope.entity = {
        data: {}
      };

      scope.widget = {field:{}};

      scope.locale = {
        code: 'en-US'
      };

      compileElement();
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
      scope.widget.widgetType = 'textfield';
      scope.entity = {
        data: {}
      };

      scope.widget = {field: {id: 'randomfield'}};

      scope.locale = {
        code: 'en-US'
      };

      compileElement();
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
