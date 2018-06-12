'use strict';

describe('ApiNameController', () => {
  beforeEach(function () {
    module('contentful/test');

    const $controller = this.$inject('$controller');

    this.modalDialog = this.$inject('modalDialog');

    this.scope = this.$inject('$rootScope').$new();
    this.scope.field = {id: 'field-id'};

    this.getPublishedField = sinon.stub().returns({id: 'field-id'});
    this.scope.ctEditorController = {
      getPublishedField: this.getPublishedField
    };

    this.apiNameController = $controller('ApiNameController', {$scope: this.scope});
    this.$apply();
  });


  describe('isEditable()', () => {
    it('is true if field not published', function () {
      this.getPublishedField.returns(undefined);
      this.$apply();
      expect(this.apiNameController.isEditable()).toBe(true);
    });

    it('is false if field is published', function () {
      expect(this.apiNameController.isEditable()).toBe(false);
    });

    it('is true after confirmation', function* () {
      const apiNameController = this.apiNameController;

      this.modalDialog.open = sinon.stub().returns({promise: this.resolve()});

      yield apiNameController.unlockEditing();
      expect(apiNameController.isEditable()).toBe(true);
    });

    it('is false after unlock cancel', function* () {
      const apiNameController = this.apiNameController;

      this.modalDialog.open = sinon.stub().returns({promise: this.reject()});

      yield this.catchPromise(apiNameController.unlockEditing());
      expect(apiNameController.isEditable()).toBe(false);
    });
  });
});
