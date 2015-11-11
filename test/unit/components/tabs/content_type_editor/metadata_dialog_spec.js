'use strict';

describe('contentTypeEditor/metadataDialog', function () {
  beforeEach(function () {
    module('contentful/test');
    this.dialogContainer = $('<div class="client">').appendTo('body');
  });

  afterEach(function () {
    this.dialogContainer.find('.modal-dialog').scope().dialog.destroy();
    this.dialogContainer.remove();
  });

  describe('#openEditDialog()', function () {
    it('shows the content type name and description', function () {
      var metadataDialog = this.$inject('contentTypeEditor/metadataDialog');
      metadataDialog.openEditDialog({data: {name: 'NAME', description: 'DESC'}});
      this.$apply();

      var nameInput = this.dialogContainer.find('input[name=contentTypeName]');
      expect(nameInput.val()).toEqual('NAME');
      var descriptionInput = this.dialogContainer.find('textarea[name=contentTypeDescription]');
      expect(descriptionInput.val()).toEqual('DESC');
    });

    it('changes the content type name and description', function () {
      var metadataDialog = this.$inject('contentTypeEditor/metadataDialog');
      var handleMetadataChange = sinon.stub();
      metadataDialog.openEditDialog({data: {}}).then(handleMetadataChange);
      this.$apply();

      var nameInput = this.dialogContainer.find('input[name=contentTypeName]');
      nameInput.val('NEW NAME').trigger('input');
      var descriptionInput = this.dialogContainer.find('textarea[name=contentTypeDescription]');
      descriptionInput.val('NEW DESC').trigger('input');

      var submitButton = this.dialogContainer.find('button:contains(Save)');
      submitButton.trigger('click');
      this.$apply();

      sinon.assert.called(handleMetadataChange);
      var newMetadata = handleMetadataChange.firstCall.args[0];
      expect(newMetadata.name).toEqual('NEW NAME');
      expect(newMetadata.description).toEqual('NEW DESC');
    });
  });

  describe('#openCreateDialog()', function () {
    it('sets the content type id from the content type name', function () {
      var metadataDialog = this.$inject('contentTypeEditor/metadataDialog');
      var handleMetadataChange = sinon.stub();
      metadataDialog.openCreateDialog().then(handleMetadataChange);
      this.$apply();

      var nameInput = this.dialogContainer.find('input[name=contentTypeName]');
      nameInput.val('NEW NAME').trigger('input');
      this.$apply();

      var submitButton = this.dialogContainer.find('button:contains(Create)');
      submitButton.trigger('click');
      this.$apply();

      sinon.assert.called(handleMetadataChange);
      var newMetadata = handleMetadataChange.firstCall.args[0];
      expect(newMetadata.name).toEqual('NEW NAME');
      expect(newMetadata.id).toEqual('newName');
    });
  });
});
