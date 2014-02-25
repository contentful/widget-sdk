'use strict';

describe('cfDropdownEditor Directive', function () {
  var element, scope, controller;
  var compileElement;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
      ]);
    });

    inject(function ($compile, $rootScope) {
      scope = $rootScope.$new();
      scope.fieldData = { value: ''};

      scope.field = {};

      scope.getFieldValidationsOfType = sinon.stub();
      scope.getFieldValidationsOfType.returns([]);

      compileElement = function () {
        element = $compile('<div class="cf-dropdown-editor" ng-model="fieldData.value"></div>')(scope);
        scope.otChangeValue = sinon.stub();
        scope.$digest();
        controller = element.controller('cfDropdownEditorController');
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('defaults if no initial value', function() {
    compileElement();
    expect(element.find('select').scope().selected.value).toBe('');
  });

  it('renders initial value', function() {
    scope.fieldData.value = 'initial';
    scope.getFieldValidationsOfType.returns(['initial']);
    compileElement();
    expect(element.find('select').scope().selected.value).toBe('initial');
  });

  it('updates model value', function() {
    scope.fieldData.value = 'initial';
    scope.getFieldValidationsOfType.returns(['initial', 'newvalue']);
    compileElement();
    scope.selected.value = 'newvalue';
    scope.updateModel();
    scope.$digest();
    expect(element.find('select').scope().selected.value).toBe('newvalue');
  });

  describe('dropdown width class', function() {
    describe('with strings', function() {
      it('is small', function() {
        scope.getFieldValidationsOfType.returns(['01234']);
        compileElement();
        expect(scope.dropdownWidthClass()).toEqual('small-dropdown');
      });

      it('is medium', function() {
        scope.getFieldValidationsOfType.returns(['012345678901234567890']);
        compileElement();
        expect(scope.dropdownWidthClass()).toEqual('medium-dropdown');
      });

      it('is large', function() {
        scope.getFieldValidationsOfType.returns(['0123456789012345678901234567890123456789012345678901234567890123456789012345678901234']);
        compileElement();
        expect(scope.dropdownWidthClass()).toEqual('large-dropdown');
      });
    });

    describe('with integers', function() {
      it('is small', function() {
        scope.getFieldValidationsOfType.returns([12341]);
        compileElement();
        expect(scope.dropdownWidthClass()).toEqual('small-dropdown');
      });

      it('is medium', function() {
        scope.getFieldValidationsOfType.returns([123456789012345678921]);
        compileElement();
        expect(scope.dropdownWidthClass()).toEqual('medium-dropdown');
      });
    });

    describe('with numbers', function() {
      it('is small', function() {
        scope.getFieldValidationsOfType.returns([12.40]);
        compileElement();
        expect(scope.dropdownWidthClass()).toEqual('small-dropdown');
      });
    });
  });


  describe('renders a list', function() {
    var valuesList;
    beforeEach(function() {
      valuesList = ['banana', 'orange', 'strawberry'];
      scope.getFieldValidationsOfType.returns(valuesList);
      compileElement();
    });

    it('has 4 elements', function() {
      expect(element.find('option').length).toBe(4);
    });

    it('values list is set', function() {
      expect(scope.valuesList).toEqual(valuesList);
    });
  });

  describe('renders a list with a required validation', function() {
    var valuesList;
    beforeEach(function() {
      scope.field.required = true;
      valuesList = ['banana', 'orange', 'strawberry'];
      scope.getFieldValidationsOfType.returns(valuesList);
      compileElement();
    });

    it('has 3 elements', function() {
      expect(element.find('option').length).toBe(4);
    });

    it('values list is set', function() {
      expect(scope.valuesList).toEqual(valuesList);
    });
  });


  describe('selects dropdown value', function() {
    beforeEach(function() {
      compileElement();
      scope.otChangeValue.callsArg(1, null);
      scope.updateModel = sinon.stub();
      scope.selectDropdownValue('newvalue');
    });

    it('changes ot value', function() {
      expect(scope.otChangeValue).toBeCalledWith('newvalue');
    });

    it('sets the selected value', function() {
      expect(scope.selected.value).toEqual('newvalue');
    });

    it('updates the model', function() {
      expect(scope.updateModel).toBeCalled();
    });
  });

  describe('selects dropdown value for integer', function() {
    beforeEach(function() {
      compileElement();
      scope.otChangeValue = sinon.stub();
      scope.otChangeValue.callsArg(1, null);
      scope.updateModel = sinon.stub();
      scope.field.type = 'Integer';
      scope.selectDropdownValue('1');
    });

    it('changes ot value', function() {
      expect(scope.otChangeValue).toBeCalledWith(1);
    });

    it('sets the selected value', function() {
      expect(scope.selected.value).toEqual(1);
    });

    it('updates the model', function() {
      expect(scope.updateModel).toBeCalled();
    });
  });

  describe('selects dropdown value for number', function() {
    beforeEach(function() {
      compileElement();
      scope.otChangeValue = sinon.stub();
      scope.otChangeValue.callsArg(1, null);
      scope.updateModel = sinon.stub();
      scope.field.type = 'Number';
      scope.selectDropdownValue('1.2');
    });

    it('changes ot value', function() {
      expect(scope.otChangeValue).toBeCalledWith(1.2);
    });

    it('sets the selected value', function() {
      expect(scope.selected.value).toEqual(1.2);
    });

    it('updates the model', function() {
      expect(scope.updateModel).toBeCalled();
    });
  });


  describe('handles the ot value changed event', function() {
    beforeEach(inject(function($rootScope) {
      compileElement();
      scope.otPath = 'path';
      $rootScope.$broadcast('otValueChanged', 'path', 'newvalue');
      scope.$digest();
    }));

    it('sets the selected value', function() {
      expect(scope.selected.value).toEqual('newvalue');
    });
  });

});
