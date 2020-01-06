import { setCheckbox } from 'test/utils/dom';
import sinon from 'sinon';
import { $compile, $initialize, $apply, $q } from 'test/utils/ng';
import addFieldDialogTemplate from 'app/ContentModel/Editor/add_field_dialog.html';

// TODO Rewrite this with the new actor based test DSL.
describe('AddFieldDialogController', () => {
  beforeEach(async function() {
    const contentType = { data: {} };

    await $initialize(this.system);

    this.dialog = {
      promise: $q.resolve()
    };

    this.dialog.confirm = sinon.stub().returns(this.dialog);

    this.el = $compile(addFieldDialogTemplate, {
      dialog: this.dialog,
      contentType: contentType
    });
  });

  afterEach(function() {
    this.el.remove();
  });

  describe('text field group', () => {
    beforeEach(function() {
      this.el.find('button[aria-label="Text"]').click();
      $apply();
      this.el
        .find('[name=fieldName]')
        .val('my field')
        .trigger('change');
      $apply();
    });

    it('creates a symbol field', function() {
      this.el
        .find('button:contains(Create)')
        .first()
        .click();
      $apply();

      sinon.assert.calledWith(
        this.dialog.confirm,
        sinon.match({
          name: 'my field',
          apiName: 'myField',
          type: 'Symbol'
        })
      );
    });

    it('creates a symbol list field', function() {
      setCheckbox(this.el.find('#add-field-form__field-is-list').get(0), true);
      $apply();
      this.el
        .find('button:contains(Create)')
        .first()
        .click();
      $apply();

      sinon.assert.calledWith(
        this.dialog.confirm,
        sinon.match({
          type: 'Array',
          items: { type: 'Symbol' }
        })
      );
    });

    it('creates a long text field', function() {
      this.el
        .find('#field-type-long')
        .prop('checked', true)
        .click();
      $apply();
      this.el
        .find('button:contains(Create)')
        .first()
        .click();
      $apply();

      sinon.assert.calledWith(
        this.dialog.confirm,
        sinon.match({
          type: 'Text'
        })
      );
    });

    it('does not show list option for long text', function() {
      this.el
        .find('#field-type-long')
        .prop('checked', true)
        .click();
      $apply();

      const listOption = this.el.find('#add-field-form__field-is-list');
      const hiddenParents = listOption.parents('.ng-hide');
      expect(hiddenParents.length).not.toEqual(0);
    });
  });

  describe('number field group', () => {
    beforeEach(function() {
      this.el.find('button[aria-label="Number"]').click();
      $apply();
      this.el
        .find('[name=fieldName]')
        .val('my field')
        .trigger('change');
      $apply();
    });

    it('creates an integer field', function() {
      this.el
        .find('#field-type-decimal')
        .prop('checked', true)
        .click();
      $apply();
      this.el
        .find('#field-type-integer')
        .prop('checked', true)
        .click();
      $apply();
      this.el
        .find('button:contains(Create)')
        .first()
        .click();
      $apply();

      sinon.assert.calledWith(
        this.dialog.confirm,
        sinon.match({
          name: 'my field',
          apiName: 'myField',
          type: 'Integer'
        })
      );
    });

    it('creates a decimal field', function() {
      this.el
        .find('#field-type-decimal')
        .prop('checked', true)
        .click();
      $apply();
      this.el
        .find('button:contains(Create)')
        .first()
        .click();
      $apply();

      sinon.assert.calledWith(
        this.dialog.confirm,
        sinon.match({
          name: 'my field',
          apiName: 'myField',
          type: 'Number'
        })
      );
    });
  });

  describe('media field group', () => {
    beforeEach(function() {
      this.el.find('button[aria-label="Media"]').click();
      $apply();
      this.el
        .find('[name=fieldName]')
        .val('my field')
        .trigger('change');
      $apply();
    });

    it('creates an integer field', function() {
      this.el
        .find('#add-field-form__field-is-list')
        .prop('checked', true)
        .click();
      $apply();
      this.el
        .find('#add-field-form__field-is-single')
        .prop('checked', true)
        .click();
      $apply();
      this.el
        .find('button:contains(Create)')
        .first()
        .click();
      $apply();

      sinon.assert.calledWith(
        this.dialog.confirm,
        sinon.match({
          type: 'Link',
          linkType: 'Asset'
        })
      );
    });

    it('creates a decimal field', function() {
      this.el
        .find('#add-field-form__field-is-list')
        .prop('checked', true)
        .click();
      $apply();
      this.el
        .find('button:contains(Create)')
        .first()
        .click();
      $apply();

      sinon.assert.calledWith(
        this.dialog.confirm,
        sinon.match({
          type: 'Array',
          items: {
            type: 'Link',
            linkType: 'Asset'
          }
        })
      );
    });
  });

  describe('field id input', () => {
    beforeEach(function() {
      this.el.find('button[aria-label="Text"]').click();
      $apply();
    });

    it('is automatically updated from field name', function() {
      this.el
        .find('[name=fieldName]')
        .val('my field')
        .trigger('change');
      $apply();

      const apiName = this.el.find('[name=apiName]');
      expect(apiName.val()).toEqual('myField');
    });

    it('sets the api name', function() {
      this.el
        .find('[name=fieldName]')
        .val('my field')
        .trigger('change');
      $apply();
      this.el
        .find('[name=apiName]')
        .val('myApiName')
        .trigger('change');
      $apply();
      this.el
        .find('button:contains(Create)')
        .first()
        .click();
      $apply();

      sinon.assert.calledWith(
        this.dialog.confirm,
        sinon.match({
          name: 'my field',
          apiName: 'myApiName'
        })
      );
    });

    it('shows errors for invalid characters', function() {
      this.el
        .find('[name=fieldName]')
        .val('my field')
        .trigger('change');
      $apply();
      const apiName = this.el.find('[name=apiName]');

      expect(apiName.attr('aria-invalid')).not.toEqual('true');
      apiName.val('-').trigger('change');

      this.el
        .find('button:contains(Create)')
        .first()
        .click();
      $apply();
      // TODO we should actually be able to make this expectation after
      // the change to the apiName value. Unfortunately this does not
      // work because validation through the cfValidateModel directive
      // are triggered asynchronously.
      expect(apiName.attr('aria-invalid')).toEqual('true');
      sinon.assert.notCalled(this.dialog.confirm);
    });
  });

  describe('field name input', () => {
    it('shows an error if empty', function() {
      this.el.find('button[aria-label="Text"]').click();
      $apply();
      const fieldName = this.el.find('[name=fieldName]');

      expect(fieldName.attr('aria-invalid')).not.toEqual('true');
      this.el
        .find('button:contains(Create)')
        .first()
        .click();
      $apply();
      expect(fieldName.attr('aria-invalid')).toEqual('true');

      sinon.assert.notCalled(this.dialog.confirm);
    });
  });

  it('opens the field dialog when configure button is pressed', function() {
    const scope = this.el.scope();
    const openFieldDialog = sinon.stub();
    scope.ctEditorController = {
      openFieldDialog: openFieldDialog
    };

    this.el.find('button[aria-label="Text"]').click();
    $apply();
    this.el
      .find('[name=fieldName]')
      .val('my field')
      .trigger('change');
    $apply();

    this.el
      .find('button:contains(Create and configure)')
      .first()
      .click();
    $apply();

    sinon.assert.calledOnce(this.dialog.confirm);
    sinon.assert.calledWith(
      openFieldDialog,
      sinon.match({
        name: 'my field',
        apiName: 'myField',
        type: 'Symbol'
      })
    );
  });
});