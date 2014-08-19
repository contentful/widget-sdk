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

      scope.field = {
        id: 'fieldId'
      };

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
        scope.field.widgetType = editorName;
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

  makeEditorTypeTests('textfield', 'input');

  makeEditorTypeTests('textarea', 'textarea');

  makeEditorTypeTests('markdownEditor', 'div', function () {
    it('has class name', function() {
      expect(ngSwitch.children().eq(0)).toHaveClass('cf-markdown-editor');
    });
  });

  makeEditorTypeTests('radiobuttons', 'div', function () {
    it('has 2 labels', function() {
      expect(ngSwitch.find('label').length).toBe(2);
    });

    it('has 2 radio inputs', function() {
      expect(ngSwitch.find('input[type=radio]').length).toBe(2);
    });
  });

  makeEditorTypeTests('datetimeEditor', 'div', function () {
    it('has class name', function() {
      expect(ngSwitch.children().eq(0)).toHaveClass('cf-datetime-editor');
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

  makeEditorTypeTests('fileEditor', 'div', function () {
    it('has class name', function() {
      expect(ngSwitch.children().eq(0)).toHaveClass('cf-file-editor');
    });
  });

  describe('fieldData is set', function() {
    beforeEach(function() {
      scope.field.type = 'Symbol';
      scope.field.widgetType = 'textfield';
      scope.entity = {
        data: {
          fields: {
            fieldId: {
              'en-US': 'fieldvalue'
            }
          }
        }
      };

      scope.field = {
        id: 'fieldId'
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
      scope.field.type = 'Symbol';
      scope.field.widgetType = 'textfield';
      scope.entity = {
        data: {}
      };

      scope.field = {};

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
      scope.field.id = 'fieldId';
      scope.$digest();
      expect(scope.entity.data.fields.fieldId['en-US']).toBe('newfieldvalue');
    });
  });

  describe('if field does not exist', function() {
    beforeEach(function() {
      scope.field.type = 'Symbol';
      scope.field.widgetType = 'textfield';
      scope.entity = {
        data: {}
      };

      scope.field = {id: 'randomfield'};

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
      scope.field.id = 'fieldId';
      scope.$digest();
      expect(scope.entity.data.fields.fieldId['en-US']).toBe('newfieldvalue');
    });
  });

});
