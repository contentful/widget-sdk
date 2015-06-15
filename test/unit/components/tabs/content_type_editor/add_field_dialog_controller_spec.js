'use strict';

describe('AddFieldDialogController', function() {
  beforeEach(function() {
    module('contentful/test');
    var $rootScope = this.$inject('$rootScope');
    this.scope = $rootScope.$new();
    this.scope.dialog = {
      confirm: sinon.stub()
    };

    this.scope.validator = {
      run: sinon.stub().returns(true)
    };

    var $controller = this.$inject('$controller');
    this.controller = $controller('AddFieldDialogController', {$scope: this.scope});
    this.viewStateSetStub = sinon.stub(this.scope.viewState, 'set');
    this.initialNewFieldState = _.clone(this.scope.newField);
  });

  describe('sets newField', function() {

    it('newField exists', function() {
      expect(this.scope.newField).toBeDefined();
    });

    it('newField has randomly assigned id', function() {
      expect(this.scope.newField.id).toBeDefined();
    });
  });

  describe('#selectType', function() {
    describe('for a type with no variants', function() {
      beforeEach(function() {
        this.scope.selectType({
          name: 'name',
          description: 'description',
          type: 'type'
        });
      });

      it('sets the selected type', function() {
        expect(this.scope.selectedType).toBeDefined();
        expect(this.scope.selectedType.name).toBeDefined();
        expect(this.scope.selectedType.description).toBeDefined();
        expect(this.scope.selectedType.type).toBeDefined();
      });

      it('sets a flag if variants exist', function() {
        expect(this.scope.canHaveFieldVariant).toBeFalsy();
      });

      it('sets the dialog title with the selected type', function() {
        expect(this.scope.dialog.title).toMatch(this.scope.selectedType.name);
      });

      it('sets the viewstate', function() {
        sinon.assert.calledWith(this.viewStateSetStub, 'fieldConfiguration');
      });
    });

    describe('for a type with variants', function() {
      beforeEach(function() {
        this.scope.selectType({
          name: 'name',
          description: 'description',
          type: {single: 'single', multiple: 'Array'}
        });
      });

      it('sets the selected type', function() {
        expect(this.scope.selectedType).toBeDefined();
        expect(this.scope.selectedType.name).toBeDefined();
        expect(this.scope.selectedType.description).toBeDefined();
        expect(this.scope.selectedType.type).toBeDefined();
      });

      it('sets the the single value flag', function() {
        expect(this.scope.fieldOptions.isList).toBe(false);
      });

      it('sets the dialog title with the selected type', function() {
        expect(this.scope.dialog.title).toMatch(this.scope.selectedType.name);
      });

      it('sets the viewstate', function() {
        sinon.assert.calledWith(this.viewStateSetStub, 'fieldConfiguration');
      });
    });
  });

  describe('#showFieldSelection', function() {
    beforeEach(function() {
      this.scope.showFieldSelection();
    });

    it('new field name is reset', function() {
      expect(this.scope.newField.name).toEqual(this.initialNewFieldState.name);
    });

    it('new field api name is reset', function() {
      expect(this.scope.newField.apiName).toEqual(this.initialNewFieldState.apiName);
    });

    it('sets the viewstate', function() {
      sinon.assert.calledWith(this.viewStateSetStub, 'fieldSelection');
    });
  });

  describe('#configureField', function() {
    beforeEach(function() {
      this.scope.newField = {
        name: 'new field name'
      };

      var availableTypes = this.$inject('fieldFactory').all;
      this.scope.selectType(_.find(availableTypes, {name: 'Short Text'}));
    });

    describe('for a single value types', function() {
      beforeEach(function() {
        var availableTypes = this.$inject('fieldFactory').all;
        this.scope.selectType(_.find(availableTypes, {name: 'Short Text'}));
        this.scope.newField.name = 'a name';
        this.scope.configureField();
      });

      it('sets the field type', function() {
        expect(this.scope.newField.type).toEqual('Symbol');
      });

      it('sets the field apiName', function() {
        expect(this.scope.newField.apiName).toEqual('aName');
      });

      it('closes the dialog', function() {
        sinon.assert.called(this.scope.dialog.confirm);
      });
    });

    describe('for a list of symbols', function() {
      beforeEach(function() {
        var availableTypes = this.$inject('fieldFactory').all;
        this.scope.selectType(_.find(availableTypes, {name: 'Short Text'}));
        this.scope.fieldOptions.isList = true;
        this.scope.configureField();
      });

      it('sets the field type to "Array"', function() {
        expect(this.scope.newField.type).toEqual('Array');
      });

      it('sets the field items type', function() {
        expect(this.scope.newField.items.type).toEqual('Symbol');
      });

      it('sets the field apiName', function() {
        expect(this.scope.newField.apiName).toBeDefined();
      });

      it('closes the dialog', function() {
        sinon.assert.called(this.scope.dialog.confirm);
      });
    });

    describe('for a list of links', function() {
      beforeEach(function() {
        var availableTypes = this.$inject('fieldFactory').all;
        this.scope.selectType(_.find(availableTypes, {name: 'Reference'}));
        this.scope.fieldOptions.isList = true;
        this.scope.configureField();
      });

      it('sets the field type to "Array"', function() {
        expect(this.scope.newField.type).toEqual('Array');
      });

      it('sets the field items type', function() {
        expect(this.scope.newField.items.type).toEqual('Link');
        expect(this.scope.newField.items.linkType).toEqual('Entry');
      });
    });

    describe('with api name errors', function () {
      beforeEach(function () {
        this.scope.validator.run = sinon.spy(function (path) {
          if (path === 'name')
            return true;
          else
            return false;
        });
        this.scope.configureField();
      });

      it('does not confim the dialog', function () {
        sinon.assert.notCalled(this.scope.dialog.confirm);
      });

      it('does show the api name input', function () {
        expect(this.scope.showApiNameField).toBe(true);
      });
    });
  });

});
