'use strict';

// TODO rewrite this with new interaction test framework
describe('Content Type Field Controller', function () {
  beforeEach(module('contentful/test'));

  beforeEach(function () {
    this.ctEditorController = {
      openFieldDialog: sinon.stub()
    };

    this.field = {
      id: 'one', type: 'Symbol'
    };

    this.contentType = {
      data: { fields: [this.field] }
    };

    this.publishedContentType = {
      data: { fields: [] }
    };

    this.createFieldElements = function () {
      this.fieldElement = this.$compile(JST.content_type_field_list(), {
        contentType: this.contentType,
        publishedContentType: this.publishedContentType,
        ctEditorController: this.ctEditorController
      });
    };
    this.createFieldElements();

    this.scope = this.fieldElement.scope();
  });

  it('opens the field settings', function () {
    this.fieldElement.find('[aria-label=Settings]').click();
    this.$apply();
    sinon.assert.calledWith(this.ctEditorController.openFieldDialog, this.field);
  });

  describe('disable/enable action', function () {
    it('disables a field', function () {
      this.field.disabled = false;
      this.fieldElement.find('[aria-label=Actions]').click();
      this.$apply();
      this.fieldElement.find('[role=button]:contains(Disable)').click();
      this.$apply();
      expect(this.field.disabled).toBe(true);
    });

    it('enables a field', function () {
      this.field.disabled = true;
      this.$apply();
      this.fieldElement.find('[aria-label=Actions]').click();
      this.$apply();
      this.fieldElement.find('[role=button]:contains(Enable)').click();
      this.$apply();
      expect(this.field.disabled).toBe(false);
    });

    it('shows notification when disabling title field', function () {
      var modalDialog = this.$inject('modalDialog');
      var notify = sinon.stub(modalDialog, 'notify');

      this.field.disabled = false;
      this.contentType.data.displayField = this.field.id;
      this.$apply();
      this.fieldElement.find('[aria-label=Actions]').click();
      this.$apply();
      this.fieldElement.find('[role=button]:contains(Disable)').click();
      this.$apply();

      expect(this.field.disabled).toBe(false);
      sinon.assert.called(notify);
    });
  });

  describe('title action', function () {
    it('sets field as title', function () {
      expect(this.contentType.data.displayField).not.toEqual(this.field.id);

      this.fieldElement.find('[aria-label=Actions]').click();
      this.$apply();
      this.fieldElement.find('[role=button]:contains(Set field as Entry title)').click();
      this.$apply();

      expect(this.contentType.data.displayField).toEqual(this.field.id);
    });

    it('is not shown if field cannot be title', function () {
      this.field.type = 'Number';
      this.createFieldElements();
      var setEntryButton = this.fieldElement.find('[role=button]:contains(Set field as Entry title)');
      expect(setEntryButton.length).toBe(0);
    });

    it('is not shown if field is title', function () {
      this.contentType.data.displayField = this.field.id;
      this.$apply();
      var setEntryButton = this.fieldElement.find('[role=button]:contains(Set field as Entry title)');
      expect(setEntryButton.length).toBe(0);
    });

    it('is not shown if field is disabled', function () {
      this.field.disabled = true;
      this.$apply();
      var setEntryButton = this.fieldElement.find('[role=button]:contains(Set field as Entry title)');
      expect(setEntryButton.length).toBe(0);
    });
  });

  describe('delete action', function () {
    it('is not visible when field is published', function () {
      this.publishedContentType.data.fields.push(this.field);
      this.$apply();
      var deleteButton = this.fieldElement.find('[role=button]:contains(Delete)');
      expect(deleteButton.length).toEqual(0);
    });

    it('deletes a field', function () {
      var deleteField = sinon.stub();
      this.ctEditorController.deleteField = deleteField;

      var deleteButton = this.fieldElement.find('[role=button]:contains(Delete)');
      deleteButton.click();
      this.$apply();

      sinon.assert.called(deleteField);
    });
  });
});
