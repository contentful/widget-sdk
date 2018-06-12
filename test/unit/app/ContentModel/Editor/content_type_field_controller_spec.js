// TODO rewrite this with new interaction test framework
describe('Content Type Field Controller', () => {
  beforeEach(module('contentful/test'));

  beforeEach(function () {
    const fieldsTemplate = this.$inject('app/ContentModel/Editor/Template').fields;
    const { renderString } = this.$inject('ui/Framework');
    this.ctEditorController = {
      openFieldDialog: sinon.stub()
    };

    this.field = {
      id: 'one', type: 'Symbol'
    };

    this.contentType = {
      data: { fields: [this.field] }
    };

    this.context = {isNew: false};

    this.createFieldElements = function () {
      this.fieldElement = this.$compile(renderString(fieldsTemplate()), {
        contentType: this.contentType,
        publishedFields: [],
        ctEditorController: this.ctEditorController,
        context: this.context,
        data: {
          canEdit: true
        }
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
    describe('field "' + prop + '" property toggling actions', () => {
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
        const dialogs = this.$inject('ContentTypeFieldController/dialogs');
        dialogs.openDisallowDialog = sinon.spy();
        this.field[prop] = false;
        this.contentType.data.displayField = this.field.id;
        this.click('Disable');
        expect(this.field[prop]).toBe(false);
        sinon.assert.called(dialogs.openDisallowDialog);
      });
    });
  }

  describe('title action', () => {
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
      const setEntryButton = this.fieldElement.find('[role=menuitem]:contains(Set field as Entry title)');
      expect(setEntryButton.length).toBe(0);
    });

    it('is not shown if field is title', function () {
      this.contentType.data.displayField = this.field.id;
      this.$apply();
      const setEntryButton = this.fieldElement.find('[role=menuitem]:contains(Set field as Entry title)');
      expect(setEntryButton.length).toBe(0);
    });

    it('is not shown if field is disabled', function () {
      this.field.disabled = true;
      this.$apply();
      const setEntryButton = this.fieldElement.find('[role=menuitem]:contains(Set field as Entry title)');
      expect(setEntryButton.length).toBe(0);
    });

    it('is not shown if field is omitted', function () {
      this.field.omitted = true;
      this.$apply();
      const setEntryButton = this.fieldElement.find('[role=menuitem]:contains(Set field as Entry title)');
      expect(setEntryButton.length).toBe(0);
    });
  });

  describe('delete action', () => {
    beforeEach(function () {
      this.dialogs = this.$inject('ContentTypeFieldController/dialogs');
      this.getPublishedField = sinon.stub();
      this.ctEditorController.getPublishedField = this.getPublishedField;

      this.click = function () {
        const deleteButton = this.fieldElement.find('[role=menuitem]:contains(Delete)');
        deleteButton.click();
        this.$apply();
      };
    });

    it('shows notification if field is used as a title', function () {
      this.contentType.data.displayField = this.field.id;
      this.$apply();
      this.dialogs.openDisallowDialog = sinon.spy();
      this.click();
      sinon.assert.called(this.dialogs.openDisallowDialog);
    });

    it('deletes a field if field is not published', function () {
      const removeField = sinon.stub();
      this.ctEditorController.removeField = removeField;
      this.click();
      sinon.assert.called(removeField);
    });

    it('marks field as deleted if is omitted in both API and UI', function () {
      this.field.omitted = true;
      this.getPublishedField.returns(_.clone(this.field));
      this.click();
      expect(this.field.deleted).toBe(true);
    });

    it('asks about saving pending changes', function () {
      this.field.omitted = true;
      this.getPublishedField.returns(_.defaults({omitted: false}, this.field));
      const save = sinon.spy();
      this.scope.actions = {save: {execute: save}};
      this.dialogs.openSaveDialog = sinon.stub().resolves();
      this.click();
      sinon.assert.called(this.dialogs.openSaveDialog);
      sinon.assert.called(save);
    });

    it('asks for omitting the field', function () {
      this.field.omitted = false;
      this.getPublishedField.returns(_.clone(this.field));
      this.dialogs.openOmitDialog = sinon.stub().resolves();
      this.click();
      sinon.assert.called(this.dialogs.openOmitDialog);
      expect(this.field.omitted).toBe(true);
    });
  });
});
