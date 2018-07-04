'use strict';

import { dispatchOnChange } from 'test/helpers/DOM';

describe('contentTypeEditor/metadataDialog', () => {
  beforeEach(function () {
    module('contentful/test');
    this.dialogContainer = $('<div class="client">').appendTo('body');
    this.metadataDialog = this.$inject('contentTypeEditor/metadataDialog');
  });

  afterEach(function () {
    this.dialogContainer.find('.modal-dialog').scope().dialog.destroy();
    this.dialogContainer.remove();
  });

  describe('#openEditDialog()', () => {
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
      dispatchOnChange(nameInput[0], 'NEW NAME');

      const descriptionTextarea = this.dialogContainer.find('textarea[name=contentTypeDescription]');
      dispatchOnChange(descriptionTextarea[0], 'NEW DESC');

      const submitButton = this.dialogContainer.find('button:contains(Save)');
      submitButton.trigger('click');
      this.$apply();

      sinon.assert.called(handleMetadataChange);
      const newMetadata = handleMetadataChange.firstCall.args[0];
      expect(newMetadata.name).toEqual('NEW NAME');
      expect(newMetadata.description).toEqual('NEW DESC');
    });
  });

  describe('#openCreateDialog()', () => {
    it('sets the content type id from the content type name', function () {
      const handleMetadataChange = sinon.stub();
      this.metadataDialog.openCreateDialog().then((res) => {
        handleMetadataChange(res);
      });
      this.$apply();
      const nameInput = this.dialogContainer.find('input[name=contentTypeName]');
      dispatchOnChange(nameInput[0], 'NEW NAME');
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

  describe('#openDuplicateDialog()', () => {
    it('duplicates a provided content type', function () {
      const duplicate = sinon.stub().resolves();
      this.metadataDialog.openDuplicateDialog({data: {name: 'test', description: 'xyz'}}, duplicate);
      this.$apply();

      const nameInput = this.dialogContainer.find('input[name=contentTypeName]');
      expect(nameInput.attr('placeholder')).toBe('Duplicate of "test"');

      dispatchOnChange(nameInput[0], 'NEW NAME');
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
