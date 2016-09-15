'use strict';

describe('contentTypeEditor/metadataDialog', function () {
  beforeEach(function () {
    module('contentful/test');
    this.dialogContainer = $('<div class="client">').appendTo('body');
    this.metadataDialog = this.$inject('contentTypeEditor/metadataDialog');
  });

  afterEach(function () {
    this.dialogContainer.find('.modal-dialog').scope().dialog.destroy();
    this.dialogContainer.remove();
  });

  describe('#openEditDialog()', function () {
    it('shows the content type name and description', function () {
      this.metadataDialog.openEditDialog({data: {name: 'NAME', description: 'DESC'}});
      this.$apply();

      const nameInput = this.dialogContainer.find('input[name=contentTypeName]');
      expect(nameInput.val()).toEqual('NAME');
      const descriptionInput = this.dialogContainer.find('textarea[name=contentTypeDescription]');
      expect(descriptionInput.val()).toEqual('DESC');
    });

    it('changes the content type name and description', function () {
      const handleMetadataChange = sinon.stub();
      this.metadataDialog.openEditDialog({data: {}}).then(handleMetadataChange);
      this.$apply();

      const nameInput = this.dialogContainer.find('input[name=contentTypeName]');
      nameInput.val('NEW NAME').trigger('input');
      const descriptionInput = this.dialogContainer.find('textarea[name=contentTypeDescription]');
      descriptionInput.val('NEW DESC').trigger('input');

      const submitButton = this.dialogContainer.find('button:contains(Save)');
      submitButton.trigger('click');
      this.$apply();

      sinon.assert.called(handleMetadataChange);
      const newMetadata = handleMetadataChange.firstCall.args[0];
      expect(newMetadata.name).toEqual('NEW NAME');
      expect(newMetadata.description).toEqual('NEW DESC');
    });
  });

  describe('#openCreateDialog()', function () {
    it('sets the content type id from the content type name', function () {
      const handleMetadataChange = sinon.stub();
      this.metadataDialog.openCreateDialog().then(handleMetadataChange);
      this.$apply();

      const nameInput = this.dialogContainer.find('input[name=contentTypeName]');
      nameInput.val('NEW NAME').trigger('input');
      this.$apply();

      const submitButton = this.dialogContainer.find('button:contains(Create)');
      submitButton.trigger('click');
      this.$apply();

      sinon.assert.called(handleMetadataChange);
      const newMetadata = handleMetadataChange.firstCall.args[0];
      expect(newMetadata.name).toEqual('NEW NAME');
      expect(newMetadata.id).toEqual('newName');
    });
  });

  describe('#openDuplicateDialog()', function () {
    it('duplicates a provided content type', function () {
      const duplicate = sinon.stub().resolves();
      this.metadataDialog.openDuplicateDialog({data: {name: 'test', description: 'xyz'}}, duplicate);
      this.$apply();

      const nameInput = this.dialogContainer.find('input[name=contentTypeName]');
      expect(nameInput.attr('placeholder')).toBe('Duplicate of "test"');
      nameInput.val('NEW NAME').trigger('input');
      this.$apply();

      const submitButton = this.dialogContainer.find('button:contains(Duplicate)');
      submitButton.trigger('click');
      this.$apply();

      sinon.assert.called(duplicate);
      const newMetadata = duplicate.firstCall.args[0];
      expect(newMetadata.name).toEqual('NEW NAME');
      expect(newMetadata.id).toEqual('newName');
      expect(newMetadata.description).toEqual('xyz');
    });
  });
});
