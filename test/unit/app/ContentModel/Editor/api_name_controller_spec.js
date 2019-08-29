import sinon from 'sinon';
import { $initialize, $inject, $apply } from 'test/helpers/helpers';

describe('ApiNameController', () => {
  beforeEach(async function() {
    await $initialize(this.system);

    const $controller = $inject('$controller');

    this.modalDialog = $inject('modalDialog');

    this.scope = $inject('$rootScope').$new();
    this.scope.field = { id: 'field-id' };

    this.getPublishedField = sinon.stub().returns({ id: 'field-id' });
    this.scope.ctEditorController = {
      getPublishedField: this.getPublishedField
    };

    this.apiNameController = $controller('ApiNameController', { $scope: this.scope });
    $apply();
  });

  describe('isEditable()', () => {
    it('is true if field not published', function() {
      this.getPublishedField.returns(undefined);
      $apply();
      expect(this.apiNameController.isEditable()).toBe(true);
    });

    it('is false if field is published', function() {
      expect(this.apiNameController.isEditable()).toBe(false);
    });

    it('is true after confirmation', async function() {
      const apiNameController = this.apiNameController;

      this.modalDialog.open = sinon.stub().returns({ promise: Promise.resolve() });

      await apiNameController.unlockEditing();
      expect(apiNameController.isEditable()).toBe(true);
    });

    it('is false after unlock cancel', async function() {
      const apiNameController = this.apiNameController;
      const rejection = new Error('oops');

      this.modalDialog.open = sinon.stub().returns({ promise: Promise.reject(rejection) });

      let err;

      try {
        await apiNameController.unlockEditing();
      } catch (e) {
        err = e;
      }

      expect(err).toEqual(rejection);
      expect(apiNameController.isEditable()).toBe(false);
    });
  });
});
