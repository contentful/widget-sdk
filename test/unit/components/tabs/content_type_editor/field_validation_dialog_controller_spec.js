'use strict';

describe('ContentType field validation dialog Controller', function () {
  var controller, scope, stubs, notification, logger;
  beforeEach(function() {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'can', 'forField', 'type', 'at', 'remove', 'track', 'get', 'set', 'push'
      ]);
      $provide.value('can', stubs.can);
      $provide.value('availableValidations', {
        forField: stubs.forField,
        type: stubs.type
      });
      $provide.value('analytics', {
        track: stubs.track
      });
    });

    inject(function ($compile, $rootScope, $controller, $injector){
      notification = $injector.get('notification');
      logger = $injector.get('logger');
      scope = $rootScope.$new();
      scope.field = {
        'name': 'aaa',
        'id': 'aaa',
        'type': 'Text',
        'uiid': '4718xi6vshs'
      };

      scope.permissionController = { can: sinon.stub() };
      scope.permissionController.can.returns({can: true});

      scope.index = 2;
      controller = $controller('FieldValidationDialogController', {$scope: scope});
      scope.$digest();
    });
  });

  describe('validation list watcher', function() {
    beforeEach(function() {
      scope.validationList = sinon.stub();
      scope.validationList.returns({});
      scope.$digest();
      scope.validationList.returns({
        type3: 'type3'
      });
      stubs.forField.returns({
        type1: 'type1',
        type2: 'type2',
        type3: 'type3'
      });
      stubs.type.withArgs('type1').returns(false);
      stubs.type.withArgs('type2').returns(false);
      stubs.type.withArgs('type3').returns(true);
      scope.$digest();
    });

    it('filters validations', function() {
      expect(scope.availableValidations).toEqual({
        type1: 'type1',
        type2: 'type2'
      });
    });
  });

  describe('gets validation list paths', function() {
    it('for array types', function() {
      scope.field.type = 'Array';
      expect(scope.validationListPath('extra', 'path')).toEqual([
        'fields', 2, 'items', 'validations', 'extra', 'path'
      ]);
    });

    it('for non array types', function() {
      expect(scope.validationListPath('extra', 'path')).toEqual([
        'fields', 2, 'validations', 'extra', 'path'
      ]);
    });
  });

  describe('gets validation list', function() {
    var validations;
    beforeEach(function() {
      validations = {validation: 'list'};
    });
    it('for array types', function() {
      scope.field.type = 'Array';
      scope.field.items = {
        validations: validations
      };
      expect(scope.validationList()).toEqual(validations);
    });

    it('for non array types', function() {
      scope.field.validations = validations;
      expect(scope.validationList()).toEqual(validations);
    });
  });

  describe('gets validation otdoc', function() {
    it('throws exception with no validation index', function() {
      expect(scope.getValidationDoc).toThrow();
    });

    describe('with validation index', function() {
      var value;
      beforeEach(function() {
        scope.otDoc = {
          at: stubs.at
        };
        stubs.at.returns({});
        scope.validationListPath = sinon.stub();
        value = scope.getValidationDoc(2);
      });

      it('returns expected value', function() {
        expect(value).toEqual({});
      });

      it('gets path', function() {
        expect(scope.validationListPath).toBeCalledWith(2);
      });

      it('gets document', function() {
        expect(stubs.at).toBeCalled();
      });
    });
  });

  describe('gets validation list otdoc', function() {
    var value;
    beforeEach(function() {
      scope.otDoc = {
        at: stubs.at
      };
      stubs.at.returns({});
      scope.validationListPath = sinon.stub();
      value = scope.getValidationListDoc();
    });

    it('returns expected value', function() {
      expect(value).toEqual({});
    });

    it('gets path', function() {
      expect(scope.validationListPath).toBeCalled();
    });

    it('gets document', function() {
      expect(stubs.at).toBeCalled();
    });
  });

  describe('deletes validation', function() {
    beforeEach(function() {
      scope.getValidationDoc = sinon.stub();
      scope.getValidationDoc.returns({
        remove: stubs.remove
      });
      scope.validationType = sinon.stub();
      scope.field.validations = [{}];
    });

    describe('successfully', function() {
      beforeEach(function() {
        stubs.remove.callsArgWith(0, null);
        scope.deleteValidation(0);
      });

      it('gets validation doc', function() {
        expect(scope.getValidationDoc).toBeCalled();
      });

      it('removes doc', function() {
        expect(stubs.remove).toBeCalled();
      });

      it('calls analytics', function() {
        expect(stubs.track).toBeCalled();
      });

      it('gets validation type', function() {
        expect(scope.validationType).toBeCalled();
      });

      it('removes validation from field', function() {
        expect(scope.field.validations).toEqual([]);
      });
    });

    describe('unsuccessfully', function() {
      beforeEach(function() {
        stubs.remove.callsArgWith(0, {});
        scope.deleteValidation(0);
      });

      it('gets validation doc', function() {
        expect(scope.getValidationDoc).toBeCalled();
      });

      it('removes doc', function() {
        expect(stubs.remove).toBeCalled();
      });

      it('does not call analytics', function() {
        expect(stubs.track).not.toBeCalled();
      });

      it('does not get validation type', function() {
        expect(scope.validationType).not.toBeCalled();
      });

      it('does not remove validation from field', function() {
        expect(scope.field.validations).toEqual([{}]);
      });
    });

  });

  describe('adds a validation', function() {
    beforeEach(function() {
      scope.getValidationListDoc = sinon.stub();
      scope.getValidationListDoc.returns({
        get: stubs.get,
        set: stubs.set,
        push: stubs.push
      });
      scope.updateValidationsFromDoc = sinon.stub();
    });

    describe('adds to existing validation doc', function() {
      beforeEach(function() {
        stubs.get.returns({});
      });

      describe('successfully', function() {
        beforeEach(function() {
          stubs.push.callsArgWith(1, null);
          scope.addValidation({});
        });

        it('gets validation list doc', function() {
          expect(scope.getValidationListDoc).toBeCalled();
        });

        it('gets document', function() {
          expect(stubs.get).toBeCalled();
        });

        it('pushes document', function() {
          expect(stubs.push).toBeCalled();
        });

        it('updates validations from doc', function() {
          expect(scope.updateValidationsFromDoc).toBeCalled();
        });
      });

      describe('unsuccessfully', function() {
        beforeEach(function() {
          stubs.push.callsArgWith(1, {});
          scope.addValidation({});
        });

        it('gets validation list doc', function() {
          expect(scope.getValidationListDoc).toBeCalled();
        });

        it('gets document', function() {
          expect(stubs.get).toBeCalled();
        });

        it('pushes document', function() {
          expect(stubs.push).toBeCalled();
        });

        it('shows server error', function() {
          expect(notification.error).toBeCalled();
          expect(logger.logSharejsWarn).toBeCalled();
        });

        it('does not update validations from doc', function() {
          expect(scope.updateValidationsFromDoc).not.toBeCalled();
        });
      });
    });

    describe('adds to new validation doc', function() {
      beforeEach(function() {
        stubs.get.returns(null);
      });

      describe('successfully', function() {
        beforeEach(function() {
          stubs.set.callsArgWith(1, null);
          scope.addValidation({});
        });

        it('gets validation list doc', function() {
          expect(scope.getValidationListDoc).toBeCalled();
        });

        it('gets document', function() {
          expect(stubs.get).toBeCalled();
        });

        it('pushes document', function() {
          expect(stubs.set).toBeCalled();
        });

        it('updates validations from doc', function() {
          expect(scope.updateValidationsFromDoc).toBeCalled();
        });
      });

      describe('unsuccessfully', function() {
        beforeEach(function() {
          stubs.set.callsArgWith(1, {});
          scope.addValidation({});
        });

        it('gets validation list doc', function() {
          expect(scope.getValidationListDoc).toBeCalled();
        });

        it('gets document', function() {
          expect(stubs.get).toBeCalled();
        });

        it('pushes document', function() {
          expect(stubs.set).toBeCalled();
        });

        it('shows server error', function() {
          expect(notification.error).toBeCalled();
          expect(logger.logSharejsWarn).toBeCalled();
        });

        it('does not update validations from doc', function() {
          expect(scope.updateValidationsFromDoc).not.toBeCalled();
        });
      });
    });

  });

  describe('update validations from doc', function() {
    var validations;
    beforeEach(function() {
      scope.getValidationListDoc = sinon.stub();
      scope.getValidationListDoc.returns({
        get: stubs.get
      });
      validations = {validations: true};
      stubs.get.returns(validations);
    });

    describe('for arrays', function() {
      beforeEach(function() {
        scope.field.type = 'Array';
        scope.field.items = {};
        scope.updateValidationsFromDoc();
      });

      it('gets validation list from doc', function() {
        expect(scope.getValidationListDoc).toBeCalled();
      });

      it('sets validations on field', function() {
        expect(scope.field.items.validations).toBe(validations);
      });
    });

    describe('for not arrays', function() {
      beforeEach(function() {
        scope.updateValidationsFromDoc();
      });

      it('gets validation list from doc', function() {
        expect(scope.getValidationListDoc).toBeCalled();
      });

      it('sets validations on field', function() {
        expect(scope.field.validations).toBe(validations);
      });
    });

  });

  it('can add validations', function () {
    scope.permissionController.can.returns({can: true});
    scope.availableValidations = [{}];
    scope.$digest();
    expect(scope.canAddValidations()).toBeTruthy();
  });

  it('cannot add validations', function () {
    scope.permissionController.can.returns({can: false});
    scope.availableValidations = [{}];
    scope.$digest();
    expect(scope.canAddValidations()).toBeFalsy();
  });

});


