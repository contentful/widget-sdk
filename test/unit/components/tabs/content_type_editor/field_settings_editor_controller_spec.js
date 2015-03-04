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
    it('does nothing with no otDoc', function() {
      sinon.assert.notCalled(stubs.at);
    });

    describe('with an otDoc', function() {
      beforeEach(function() {
        scope.otDoc = {
          at: stubs.at
        };
        stubs.at.returns({
          set: stubs.set
        });

        scope.index = 2;
        scope.field = {
          name: 'fieldname',
          id: 'fieldid',
          apiName: 'fieldApiName'
        };

        scope.otUpdateEntity = sinon.stub();
      });

      describe('update suceeds', function() {
        beforeEach(function() {
          stubs.set.callsArgWith(1, null);
          scope.changeFieldType({});
        });

        it('gets otdoc', function() {
          sinon.assert.called(stubs.at);
        });

        it('at called with field path', function() {
          expect(stubs.at).toBeCalledWith(['fields', 2]);
        });

        it('sets new field on otdoc', function() {
          expect(stubs.set).toBeCalledWith(scope.field);
        });

        it('updates ot entity', function() {
          sinon.assert.called(scope.otUpdateEntity);
        });
      });

      describe('update fails', function() {
        beforeEach(function() {
          stubs.set.callsArgWith(1, {});
          scope.changeFieldType({});
        });

        it('does not update ot entity', function() {
          sinon.assert.notCalled(scope.otUpdateEntity);
        });

        it('shows error', function() {
          sinon.assert.called(logger.logSharejsWarn);
          sinon.assert.called(notification.error);
        });
      });
    });
  });

  describe('toggling properties', function() {
    it('does nothing with no otDoc', function() {
      sinon.assert.notCalled(stubs.at);
    });

    describe('with an otDoc', function() {
      beforeEach(function() {
        scope.otDoc = {
          at: stubs.at
        };
        scope.index = 2;
        stubs.at.returns({
          set: stubs.set,
          get: stubs.get
        });
        stubs.get.returns(true);

        scope.otUpdateEntity = sinon.stub();
      });

      describe('update suceeds', function() {
        beforeEach(function() {
          stubs.set.callsArgWith(1, null);
          scope.toggle('propname');
        });

        it('gets otdoc', function() {
          sinon.assert.called(stubs.at);
        });

        it('at called with field path', function() {
          expect(stubs.at).toBeCalledWith(['fields', 2, 'propname']);
        });

        it('gets current property value for toggling', function() {
          sinon.assert.called(stubs.get);
        });

        it('sets new property on otdoc', function() {
          expect(stubs.set).toBeCalledWith(false);
        });

        it('updates ot entity', function() {
          sinon.assert.called(scope.otUpdateEntity);
        });

        it('fires analytics event', function() {
          sinon.assert.called(stubs.modifiedContentType);
        });
      });

      describe('update fails', function() {
        beforeEach(function() {
          stubs.set.callsArgWith(1, {});
          scope.toggle('propname');
        });

        it('does not update ot entity', function() {
          sinon.assert.notCalled(scope.otUpdateEntity);
        });

        it('shows error', function() {
          sinon.assert.called(logger.logSharejsWarn);
          sinon.assert.called(notification.warn);
        });
      });
    });

  });

  describe('deletes field setting', function() {
    it('does nothing with no otDoc', function() {
      sinon.assert.notCalled(stubs.at);
    });

    describe('with an otDoc', function() {
      beforeEach(function() {
        scope.otDoc = {
          at: stubs.at
        };
        stubs.at.returns({
          remove: stubs.remove
        });

        scope.index = 2;
        scope.field = {
          field: true
        };

        scope.otUpdateEntity = sinon.stub();
      });

      describe('update suceeds', function() {
        var field;
        beforeEach(function(done) {
          stubs.remove.callsArgWith(0, null);
          scope.$on('fieldDeleted', function (event, deletedField) {
            field = deletedField;
            done();
          });
          scope.delete();
        });

        it('gets otdoc', function() {
          sinon.assert.called(stubs.at);
        });

        it('at called with field path', function() {
          expect(stubs.at).toBeCalledWith(['fields', 2]);
        });

        it('deletes property on otdoc', function() {
          sinon.assert.called(stubs.remove);
        });

        it('updates ot entity', function() {
          sinon.assert.called(scope.otUpdateEntity);
        });

        it('fires analytics event', function() {
          sinon.assert.called(stubs.modifiedContentType);
        });

        it('emits fieldDeleted event', function() {
          expect(field).toBe(scope.field);
        });
      });

      describe('update fails', function() {
        beforeEach(function() {
          stubs.remove.callsArgWith(0, {});
          scope.delete();
        });

        it('does not update ot entity', function() {
          sinon.assert.notCalled(scope.otUpdateEntity);
        });
      });
    });

  });


});
