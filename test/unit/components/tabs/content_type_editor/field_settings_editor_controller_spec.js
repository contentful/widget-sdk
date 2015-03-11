'use strict';

describe('Field Settings Editor Controller', function () {
  var controller, scope, stubs;
  var logger, notification;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'perType', 'fieldTypeParams', 'fieldIsPublished', 'open',
        'at', 'set', 'get', 'modifiedContentType', 'remove'
      ]);

      $provide.removeControllers('ApiNameController');

      $provide.constant('validation', {
        Validation: {
          perType: stubs.perType
        }
      });

      $provide.value('validationDialog', {
        open: stubs.open
      });

      $provide.value('analytics', {
        modifiedContentType: stubs.modifiedContentType
      });

    });
    inject(function ($controller, $rootScope, $injector) {
      scope = $rootScope.$new();
      logger       = $injector.get('logger');
      notification = $injector.get('notification');

      scope.field = {};
      scope.pickNewDisplayField = sinon.stub();

      controller = $controller('FieldSettingsEditorController', {$scope: scope});
      scope.$digest();
    });
  });

  it('has no validations', function() {
    expect(scope.hasValidations).toBeFalsy();
  });

  it('has validations', function() {
    scope.field.validations = [{validate: true}];
    scope.$digest();
    expect(scope.hasValidations).toBeTruthy();
  });

  it('has items validations', function() {
    scope.field.items = {
      validations: [{validate: true}]
    };
    scope.$digest();
    expect(scope.hasValidations).toBeTruthy();
  });

  describe('on fieldTypeParams changes', function() {
    beforeEach(function() {
      scope.fieldTypeParams = stubs.fieldTypeParams;
      stubs.fieldTypeParams.returns({});
    });

    it('validations are available', function() {
      stubs.perType.returns([{}]);
      scope.$digest();
      expect(scope.validationsAvailable).toBeTruthy();
    });

    it('validations are not available', function() {
      stubs.perType.returns([]);
      scope.$digest();
      expect(scope.validationsAvailable).toBeFalsy();
    });
  });

  describe('gets published status', function() {
    beforeEach(function() {
      scope.fieldIsPublished = stubs.fieldIsPublished;
    });

    it('is true', function() {
      stubs.fieldIsPublished.returns(true);
      scope.$digest();
      expect(scope.published).toBeTruthy();
    });

    it('is false', function() {
      stubs.fieldIsPublished.returns(false);
      scope.$digest();
      expect(scope.published).toBeFalsy();
    });
  });

  describe('status tooltip text', function() {
    it('is disabled', function() {
      scope.published = true;
      scope.field.disabled = true;
      scope.$digest();
      expect(scope.statusTooltipText()).toMatch(/disabled/i);
    });

    it('is active', function() {
      scope.published = true;
      scope.field.disabled = false;
      scope.$digest();
      expect(scope.statusTooltipText()).toMatch(/active/i);
    });

    it('is new', function() {
      scope.published = false;
      scope.$digest();
      expect(scope.statusTooltipText()).toMatch(/new/i);
    });
  });

  describe('status class', function() {
    it('is disabled', function() {
      scope.published = true;
      scope.field.disabled = true;
      scope.$digest();
      expect(scope.statusClass()).toBe('disabled');
    });

    it('is published', function() {
      scope.published = true;
      scope.field.disabled = false;
      scope.$digest();
      expect(scope.statusClass()).toBe('published');
    });

    it('is unpublished', function() {
      scope.published = false;
      scope.$digest();
      expect(scope.statusClass()).toBe('unpublished');
    });
  });

  describe('check if field is display field', function() {
    beforeEach(function() {
      scope.contentType = {data: {}};
    });

    it('true', function() {
      scope.field.id = 'fieldid';
      scope.contentType.data.displayField = 'fieldid';
      scope.$digest();
      expect(scope.isDisplayField()).toBeTruthy();
    });

    it('false', function() {
      scope.field.id = 'fieldid';
      scope.contentType.data.displayField = 'something else';
      scope.$digest();
      expect(scope.isDisplayField()).toBeFalsy();
    });
  });

  describe('change field type', function() {
    beforeEach(function() {
      scope.pickNewDisplayField = sinon.stub();
      scope.field = {
        name: 'name',
        id: 'id',
        apiName: 'apiName',
        type: 'Text'
      };
      scope.index = 1;
      scope.contentType = {
        data: { fields: [{}, _.clone(scope.field)] }
      };
      scope.changeFieldType({type: 'Symbol'});
    });

    it('changes second field type', function() {
      expect(scope.contentType.data.fields[1].type).toBe('Symbol');
    });

    it('picks new display field', function() {
      sinon.assert.called(scope.pickNewDisplayField);
    });
  });

  describe('toggling properties', function() {
    beforeEach(function() {
      scope.index = 1;
      scope.contentType = {
        data: { fields: [{}, {required: false}] }
      };
      scope.contentTypeForm = {
        $setDirty: sinon.stub()
      };
      scope.toggle('required');
    });

    it('toggles property', function() {
      expect(scope.contentType.data.fields[1].required).toBe(true);
    });

    it('fires analytics event', function() {
      sinon.assert.called(stubs.modifiedContentType);
    });
  });

  describe('deletes field setting', function() {
    beforeEach(function() {
      scope.index = 1;
      scope.contentType = {
        data: { fields: [{id: 'field1'}, {id: 'field2'}] }
      };
      scope.$emit = sinon.stub();
      scope.delete();
    });

    it('fields length is now 1', function() {
      expect(scope.contentType.data.fields.length).toBe(1);
    });

    it('fires analytics event', function() {
      sinon.assert.called(stubs.modifiedContentType);
    });

    it('picks new display field', function() {
      sinon.assert.called(scope.pickNewDisplayField);
    });

    it('emits field deleted event with removed field', function() {
      sinon.assert.calledWith(scope.$emit, 'fieldDeleted', {id: 'field2'});
    });
  });


});
