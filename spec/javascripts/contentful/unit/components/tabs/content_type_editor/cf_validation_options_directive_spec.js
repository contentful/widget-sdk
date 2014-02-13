'use strict';

describe('The cfValidationOptions directive', function () {

  var container, scope, controller;
  var compileElement;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['set', 'validationType']);
    });

    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();

      scope.field = {};

      compileElement = function () {
        container = $('<div class="cf-validation-options"></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  describe('the controller', function() {
    beforeEach(function() {
      compileElement();
      controller = container.controller('cfValidationOptions');
    });

    describe('updates the validation doc', function() {
      beforeEach(function() {
        scope.updateValidationsFromDoc = sinon.stub();
        scope.getValidationDoc = sinon.stub();
        scope.getValidationDoc.returns({
          set: stubs.set
        });
      });

      describe('fails to update if no validation index', function() {
        beforeEach(function() {
          scope.updateDoc();
        });

        it('does not try to get validation doc', function() {
          expect(scope.getValidationDoc).not.toBeCalled();
        });

        it('does not try to update validations', function() {
          expect(scope.updateValidationsFromDoc).not.toBeCalled();
        });
      });

      describe('suceeds', function() {
        beforeEach(function() {
          scope.validationIndex = 2;
          scope.validation = {validation: true};
          stubs.set.callsArg(1);
          scope.updateDoc();
        });

        it('gets the validation doc', function() {
          expect(scope.getValidationDoc).toBeCalledWith(2);
        });

        it('sets the new validation on the doc', function() {
          expect(stubs.set).toBeCalledWith(scope.validation);
        });

        it('updates validations', function() {
          expect(scope.updateValidationsFromDoc).toBeCalled();
        });
      });
    });

    describe('changes the validation type', function() {
      beforeEach(function() {
        scope.validationType = sinon.stub();
        scope.validationType.returns('oldType');
        scope.validationType.withArgs({newType: true}).returns('newType');
        scope.validation = {};
        scope.validation.oldType = {};
        scope.updateDoc = sinon.stub();
        scope.changeType({newType: true});
      });

      it('gets the validation types', function() {
        expect(scope.validationType).toBeCalledTwice();
      });

      it('removes the old type', function() {
        expect(scope.validation.oldType).toBeUndefined();
      });

      it('has the new type', function() {
        expect(scope.validation.newType).toBeDefined();
      });

      it('updates the doc', function() {
        expect(scope.updateDoc).toBeCalled();
      });
    });
  });

  describe('hides validation type select', function() {
    describe('if no validations are defined', function() {
      beforeEach(function() {
        scope.isEmpty = true;
        compileElement();
      });

      it('hides elements', function() {
        expect(container.find('.validation-type-select')).toBeNgHidden();
      });
    });

    describe('if no validations are already defined for this type', function() {
      beforeEach(function() {
        scope.availableValidations = true;
        compileElement();
      });

      it('hides elements', function() {
        expect(container.find('.validation-type-select')).toBeNgHidden();
      });
    });
  });

  describe('shows validation type select', function() {
    beforeEach(function() {
      scope.isEmpty = false;
      scope.availableValidations = false;
      compileElement();
    });

    it('hides elements', function() {
      expect(container.find('.validation-type-select')).toBeNgHidden();
    });
  });

  describe('switches validation types', function() {
    beforeEach(function() {
      scope.validationType = stubs.validationType;
    });

    function createFormTest(type, element) {
      it('has form elements defined for '+type, function() {
        stubs.validationType.returns(type);
        compileElement();
        expect(container.find('.validation-controls '+element).get(0)).toBeDefined();
      });
    }

    createFormTest('size', 'input');
    createFormTest('range', 'input');
    createFormTest('regexp', 'input');
    createFormTest('in', 'input');
    createFormTest('linkContentType', 'select');
    createFormTest('linkMimetypeGroup', 'select');
  });

});
