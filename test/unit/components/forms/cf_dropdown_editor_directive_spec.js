'use strict';

describe('cfDropdownEditor Directive', function () {
  var element, scope, controller;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.stubDirective('otPath', {controller: function ($scope, $q) {
        $scope.otChangeValue = sinon.stub().returns($q.when());
      }});
    });

    inject(function ($compile, $rootScope) {
      scope = $rootScope.$new();
      scope.fieldData = { value: ''};

      scope.field = {};

      scope.getFieldValidationsOfType = sinon.stub().returns([]);

      compileElement = function () {
        element = $compile('<div cf-dropdown-editor ot-bind-internal="valuesController.selected" ot-path="" ng-model="fieldData.value"></div>')(scope);
        scope.$apply();
        controller = element.controller('cfDropdownEditorController');
      };
    });
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

    describe('with empty values', function(){
      it('is small', function() {
        scope.getFieldValidationsOfType.returns([]);
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
      expect(scope.valuesController.valuesList).toEqual([
        {label: 'banana'    , value: 'banana'},
        {label: 'orange'    , value: 'orange'},
        {label: 'strawberry', value: 'strawberry'},
      ]);
    });
  });

  describe('selects dropdown value', function() {
    beforeEach(function() {
      var valuesList = ['banana', 'orange', 'strawberry'];
      scope.getFieldValidationsOfType.returns(valuesList);
      compileElement();
      element.find('select').val(1).trigger('change');
    });

    it('changes ot value', function() {
      expect(scope.otChangeValue).toBeCalledWith('orange');
    });

    it('sets the selected value', function() {
      expect(scope.valuesController.selected).toEqual('orange');
    });
  });

  describe('selects dropdown value for integer', function() {
    beforeEach(function() {
      var valuesList = [0,1,2,3];
      scope.getFieldValidationsOfType.returns(valuesList);
      scope.field.type = 'Integer';
      compileElement();
      element.find('select').val(1).trigger('change');
    });

    it('changes ot value', function() {
      expect(scope.otChangeValue).toBeCalledWith(1);
    });

    it('sets the selected value', function() {
      expect(scope.valuesController.selected).toEqual(1);
    });
  });

  describe('selects dropdown value for number', function() {
    beforeEach(function() {
      var valuesList = [0.2,1.2,2.2,3.2];
      scope.getFieldValidationsOfType.returns(valuesList);
      scope.field.type = 'Number';
      compileElement();
      element.find('select').val(1).trigger('change');
    });

    it('changes ot value', function() {
      expect(scope.otChangeValue).toBeCalledWith(1.2);
    });

    it('sets the selected value', function() {
      expect(scope.valuesController.selected).toEqual(1.2);
    });
  });


  describe('handles the ot value changed event', function() {
    beforeEach(inject(function($rootScope) {
      var valuesList = [0.2,1.2,2.2,3.2];
      scope.getFieldValidationsOfType.returns(valuesList);
      compileElement();
      scope.otPath = 'path';
      $rootScope.$broadcast('otValueChanged', 'path', 'newvalue');
      scope.$digest();
    }));

    it('sets the selected value', function() {
      expect(scope.valuesController.selected).toEqual('newvalue');
    });
  });

});
