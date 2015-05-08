'use strict';

describe('AddFieldDialogController', function() {
  beforeEach(function() {
    module('contentful/test');
    var $rootScope = this.$inject('$rootScope');
    this.scope = $rootScope.$new();
    this.scope.dialog = {
      confirm: sinon.stub()
    };

    var $controller = this.$inject('$controller');
    this.controller = $controller('AddFieldDialogController', {$scope: this.scope});
    this.viewStateSetStub = sinon.stub(this.scope.viewState, 'set');
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
        sinon.assert.called(this.viewStateSetStub);
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

      it('sets a flag if variants exist', function() {
        expect(this.scope.canHaveFieldVariant).toBeTruthy();
      });

      it('sets the default selected variant', function() {
        expect(this.scope.selectedFieldVariant).toBeDefined();
      });

      it('sets the dialog title with the selected type', function() {
        expect(this.scope.dialog.title).toMatch(this.scope.selectedType.name);
      });

      it('sets the viewstate', function() {
        sinon.assert.called(this.viewStateSetStub);
      });
    });
  });

  describe('#configureField', function() {
    beforeEach(function() {
      this.scope.newField = {
        name: 'new field name'
      };
      this.scope.selectedType = {
        type: 'selectedType'
      };
    });

    describe('for a type with no variants', function() {
      beforeEach(function() {
        this.scope.configureField();
      });

      it('sets the field type', function() {
        expect(this.scope.newField.type).toBeDefined();
      });

      it('sets the field apiName', function() {
        expect(this.scope.newField.apiName).toBeDefined();
      });

      it('closes the dialog', function() {
        sinon.assert.called(this.scope.dialog.confirm);
      });
    });

    describe('for a type with variants', function() {
      beforeEach(function() {
        this.scope.canHaveFieldVariant = true;
        this.scope.selectedType.linkType = 'linkType';
        this.scope.selectedFieldVariant = 'Array';
        this.scope.configureField();
      });

      it('sets the field type', function() {
        expect(this.scope.newField.type).toBeDefined();
      });

      it('sets the field linktype', function() {
        expect(this.scope.newField.linkType).toBeDefined();
      });

      it('sets the field apiName', function() {
        expect(this.scope.newField.apiName).toBeDefined();
      });

      it('closes the dialog', function() {
        sinon.assert.called(this.scope.dialog.confirm);
      });
    });
  });

});
