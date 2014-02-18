'use strict';

describe('The cfValidationOptions directive', function () {

  var container, scope, controller;
  var compileElement;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['set', 'validationType', 'warn']);

      $provide.value('notification', {
        warn: stubs.warn
      });
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

    describe('updates values', function() {
      var result;
      beforeEach(function() {
        scope.validation = {};
        scope.updateDoc = sinon.stub();
      });

      describe('with a new value', function() {
        beforeEach(function() {
          result = scope.updateValues('hello');
        });

        it('returns true', function() {
          expect(result).toBeTruthy();
        });

        it('new value is in validation list', function() {
          expect(scope.validation.in[0]).toEqual('hello');
        });

        it('document is updated', function() {
          expect(scope.updateDoc).toBeCalled();
        });
      });

      describe('with an existing new value', function() {
        beforeEach(function() {
          scope.validation.in = ['hello'];
          result = scope.updateValues('hello');
        });

        it('returns falsy', function() {
          expect(result).toBeFalsy();
        });

        it('new value is not repeated in validation list', function() {
          expect(scope.validation.in.length).toEqual(1);
        });

        it('document is not updated', function() {
          expect(scope.updateDoc).not.toBeCalled();
        });

        it('shows notification', function() {
          expect(stubs.warn).toBeCalled();
        });
      });

      describe('if max number of values is reached', function() {
        beforeEach(function() {
          scope.validation.in = new Array(50);
          result = scope.updateValues('hello');
        });

        it('returns falsy', function() {
          expect(result).toBeFalsy();
        });

        it('length is unchanged', function() {
          expect(scope.validation.in.length).toEqual(50);
        });

        it('document is not updated', function() {
          expect(scope.updateDoc).not.toBeCalled();
        });

        it('shows notification', function() {
          expect(stubs.warn).toBeCalled();
        });
      });

      describe('if value is over max length', function() {
        beforeEach(function() {
          scope.validation.in = [];
          result = scope.updateValues((new Array(100)).join('a'));
        });

        it('returns falsy', function() {
          expect(result).toBeFalsy();
        });

        it('length is unchanged', function() {
          expect(scope.validation.in.length).toEqual(0);
        });

        it('document is not updated', function() {
          expect(scope.updateDoc).not.toBeCalled();
        });

        it('shows notification', function() {
          expect(stubs.warn).toBeCalled();
        });
      });


    });

    describe('removes values', function() {
      beforeEach(function() {
        scope.validation = {in: ['value1', 'value2']};
        scope.updateDoc = sinon.stub();
        scope.removeValue(1);
      });

      it('value is not in list', function() {
        expect(scope.validation.in[1]).toBeUndefined();
      });

      it('list has only one item', function() {
        expect(scope.validation.in.length).toEqual(1);
      });

      it('document is updated', function() {
        expect(scope.updateDoc).toBeCalled();
      });
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

  describe('submit value', function() {
    var event, target;
    beforeEach(function() {
      compileElement();
      target = $('<input type="text" value="targetvalue" />');
      event = {
        target: target,
        preventDefault: sinon.stub(),
        stopPropagation: sinon.stub()
      };
      scope.updateValues = sinon.stub();
    });

    describe('on enter key', function() {
      beforeEach(inject(function(keycodes) {
        event.keyCode = keycodes.ENTER;
        scope.updateValues.returns(true);
        scope.submitValue(event);
      }));

      it('stops propagation', function() {
        expect(event.stopPropagation).toBeCalled();
      });

      it('prevents default', function() {
        expect(event.preventDefault).toBeCalled();
      });

      it('updates values', function() {
        expect(scope.updateValues).toBeCalledWith('targetvalue');
      });

      it('value is reset to empty', function() {
        expect(target.val()).toBe('');
      });
    });

    describe('on enter key if value fails to update', function() {
      beforeEach(inject(function(keycodes) {
        event.keyCode = keycodes.ENTER;
        scope.updateValues.returns(false);
        scope.submitValue(event);
      }));

      it('stops propagation', function() {
        expect(event.stopPropagation).toBeCalled();
      });

      it('prevents default', function() {
        expect(event.preventDefault).toBeCalled();
      });

      it('updates values', function() {
        expect(scope.updateValues).toBeCalledWith('targetvalue');
      });

      it('value is not reset to empty', function() {
        expect(target.val()).toBe('targetvalue');
      });
    });


    describe('on any other key', function() {
      beforeEach(function() {
        event.keyCode = 6;
        scope.submitValue(event);
      });

      it('stops propagation', function() {
        expect(event.stopPropagation).toBeCalled();
      });

      it('does not prevent default', function() {
        expect(event.preventDefault).not.toBeCalled();
      });

      it('does not update values', function() {
        expect(scope.updateValues).not.toBeCalled();
      });

      it('value is not reset to empty', function() {
        expect(target.val()).toBe('targetvalue');
      });
    });

  });

  describe('remove a value from list', function() {
    var target, container;
    beforeEach(function() {
      target = $('<input type="text" value="targetvalue" />');
      container = $('<div><span></span></div>');
      target.appendTo(container.find('span'));
      compileElement();
      scope.removeValue = sinon.stub();
      scope.removeFromValuesList({target: target}, 1);
    });

    it('removes containing node', function() {
      expect(container.find('span').get(0)).toBeUndefined();
    });

    it('removes index', function() {
      expect(scope.removeValue).toBeCalledWith(1);
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
      scope.validation = {in: []};
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
