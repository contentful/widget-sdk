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

  describeFieldPropertyActions('omitted');
  describeFieldPropertyActions('disabled');

  function describeFieldPropertyActions (prop) {
    describe('field "' + prop + '" property toggling actions', function () {
      beforeEach(function () {
        this.click = function (label) {
          this.fieldElement.find('[aria-label=Actions]').click();
          this.$apply();
          this.fieldElement.find('[role=menuitem]:contains(' + label + ')').click();
          this.$apply();
        };
      });

      it('marks a field as ' + prop, function () {
        this.field[prop] = false;
        this.click('Disable');
        expect(this.field[prop]).toBe(true);
      });

      it('marks a field as not ' + prop, function () {
        this.field[prop] = true;
        this.click('Enable');
        expect(this.field[prop]).toBe(false);
      });

      it('shows notification when marking title field as ' + prop, function () {
        var modalDialog = this.$inject('modalDialog');
        var open = sinon.stub(modalDialog, 'open');
        this.field[prop] = false;
        this.contentType.data.displayField = this.field.id;
        this.click('Disable');
        expect(this.field[prop]).toBe(false);
        sinon.assert.called(open);
      });
    });
  }

  describe('title action', function () {
    it('sets field as title', function () {
      expect(this.contentType.data.displayField).not.toEqual(this.field.id);

      this.fieldElement.find('[aria-label=Actions]').click();
      this.$apply();
      this.fieldElement.find('[role=menuitem]:contains(Set field as Entry title)').click();
      this.$apply();

      expect(this.contentType.data.displayField).toEqual(this.field.id);
    });

    it('is not shown if field cannot be title', function () {
      this.field.type = 'Number';
      this.createFieldElements();
      var setEntryButton = this.fieldElement.find('[role=menuitem]:contains(Set field as Entry title)');
      expect(setEntryButton.length).toBe(0);
    });

    it('is not shown if field is title', function () {
      this.contentType.data.displayField = this.field.id;
      this.$apply();
      var setEntryButton = this.fieldElement.find('[role=menuitem]:contains(Set field as Entry title)');
      expect(setEntryButton.length).toBe(0);
    });

    it('is not shown if field is disabled', function () {
      this.field.disabled = true;
      this.$apply();
      var setEntryButton = this.fieldElement.find('[role=menuitem]:contains(Set field as Entry title)');
      expect(setEntryButton.length).toBe(0);
    });

    it('is not shown if field is omitted', function () {
      this.field.omitted = true;
      this.$apply();
      var setEntryButton = this.fieldElement.find('[role=menuitem]:contains(Set field as Entry title)');
      expect(setEntryButton.length).toBe(0);
    });
  });

  describe('delete action', function () {
    it('deletes a field', function () {
      var deleteField = sinon.stub();
      this.ctEditorController.deleteField = deleteField;

      var deleteButton = this.fieldElement.find('[role=menuitem]:contains(Delete)');
      deleteButton.click();
      this.$apply();

      sinon.assert.called(deleteField);
    });
  });
});
