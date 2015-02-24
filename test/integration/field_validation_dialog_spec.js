'use strict';

/**
 * Tests the following controller and directives
 *
 * - `FieldValidationDialogController`
 * - `cfValidationsettings`
 * - `cfValidationValues`
 * - `cfValidationLinkType`
 *
 * Stubs the scope's `field`, `index`, and `otDoc`.
 *
 * TODO
 *
 * - Duplicate validation tests for Array type fields. Use a test case
 *   factory for that.
 */
describe('validation dialog', function() {
  var openDialog, dialog, scope;

  function validationsDoc(scope) {
    return scope.otDoc.at(['fields', scope.index, 'validations']);
  }

  /**
   * A small mock OtDoc implementation.
   */
  function OtDoc(root, path) {
    this.root = root || {};
    this.path = path || [];
  }

  OtDoc.prototype = {
    at: function(path) {
      return new OtDoc(this.root, this.path.concat(path));
    },
    set: function(value, cb) {
      dotty.put(this.root, this.path, value);
      cb();
    },
    get: function() {
      return dotty.get(this.root, this.path);
    },
  };


  beforeEach(function () {
    var modalDialog;
    module('contentful/test');
    inject(function($rootScope, $injector) {
      scope        = $rootScope.$new();
      modalDialog  = $injector.get('modalDialog');
    });

    openDialog = function() {
      if (dialog)
        dialog.cancel();

      dialog = modalDialog.open({
        scope: scope,
        template: 'validation_dialog',
        attachTo: 'body'
      });
      scope.$digest();
      return dialog;
    };

    scope.otEditable = true;
    scope.field = {type: 'Text'};
    scope.index = 1;
    scope.otDoc = new OtDoc({
      fields: [{}, {type: 'Text'}]
    });

    openDialog();
  });

  afterEach(function() {
    if (dialog) {
      dialog.cancel();
      dialog = null;
    }
    if (scope) {
      scope.$destroy();
      scope = null;
    }
  });

  function clickSave() {
    dialog.domElement
    .find('button:contains(Save)')
    .click();
  }


  describe('length validation', function() {

    function settings() {
      return dialog.domElement.find('[aria-label="Length"]');
    }

    it('can be enabled and set', function() {
      expect(settings().find('.validation-controls').is(':hidden')).toBe(true);

      settings()
      .find('[aria-label="Enable validation"]')
      .click();
      expect(settings().find('.validation-controls').is(':hidden')).toBe(false);

      var minInput = settings().find('[aria-label="Minimum size"]');
      minInput.val('10').trigger('input');
      var maxInput = settings().find('[aria-label="Maximum size"]');
      maxInput.val('20').trigger('input');

      clickSave();
      expect(dialog.open).toBe(false);

      expect(scope.field.validations)
      .toEqual([{size: {min: 10, max: 20}}]);
      expect(validationsDoc(scope).get())
      .toEqual([{size: {min: 10, max: 20}}]);
    });

    it('existing validation is shown and can be disabled', function() {
      scope.field.validations = [{size: {min: 10, max: 20}}];
      openDialog();

      var minInput = settings().find('[aria-label="Minimum size"]');
      expect(minInput.val()).toBe('10');
      var maxInput = settings().find('[aria-label="Maximum size"]');
      expect(maxInput.val()).toBe('20');

      settings()
      .find('[aria-label="Disable validation"]')
      .click();
      clickSave();
      expect(scope.field.validations).toEqual([]);
      expect(validationsDoc(scope).get()).toEqual([]);
    });

    it('shows errors when opened', function() {
      scope.field.validations = [{size: {min: null, max: null}}];
      openDialog();

      clickSave();
      expect(dialog.open).toBe(true);

      var errors = settings()
      .find('[aria-label="Errors"] li');
      expect(errors.text()).toEqual('Expected min and/or max boundaries');
    });

    it('does not save invalid validations', function() {
      scope.field.validations = [{size: {min: 10, max: null}}];
      openDialog();

      settings()
      .find('[aria-label="Minimum size"]')
      .val('')
      .trigger('input');

      clickSave();
      expect(dialog.open).toBe(true);

      var errors = settings()
      .find('[aria-label="Errors"] li');
      expect(errors.text()).toEqual('Expected min and/or max boundaries');
    });

    it('selects the correct initial view', function() {
      scope.field.validations = [{size: {min: 10, max: null}}];
      openDialog();

      var selectedView = settings()
      .find('select[aria-label="Select condition"]')
      .find('option:selected').text();
      expect(selectedView).toEqual('At least');
    });

  });

  describe('range validation', function() {
    // TODO Number validation with decimals

    beforeEach(function() {
      scope.field.type = 'Integer';
      openDialog();
    });

    function settings() {
      return dialog.domElement.find('[aria-label="Numerical Range"]');
    }

    it('can be enabled and set', function() {
      settings()
      .find('[aria-label="Enable validation"]')
      .click();
      settings()
      .find('[aria-label="Enable validation"]')
      .click();

      var minValue = settings().find('[aria-label="Minimum value"]');
      minValue.val('-1').trigger('input');
      var maxValue = settings().find('[aria-label="Maximum value"]');
      maxValue.val('2').trigger('input');

      clickSave();

      expect(scope.field.validations)
      .toEqual([{range: {min: -1, max: 2}}]);
      expect(validationsDoc(scope).get())
      .toEqual([{range: {min: -1, max: 2}}]);
    });

    it('it can be disabled', function() {
      scope.field.validations = [{range: {min: -1, max: 2}}];
      openDialog();

      var minInput = settings().find('[aria-label="Minimum value"]');
      expect(minInput.val()).toBe('-1');
      var maxInput = settings().find('[aria-label="Maximum value"]');
      expect(maxInput.val()).toBe('2');

      settings()
      .find('[aria-label="Disable validation"]')
      .click();
      clickSave();

      expect(scope.field.validations).toEqual([]);
      expect(validationsDoc(scope).get()).toEqual([]);
    });

  });

  describe('regexp validation', function() {
    function settings() {
      return dialog.domElement.find('[aria-label="Regular Expression"]');
    }

    it('can be enabled and set', function() {
      settings()
      .find('[aria-label="Enable validation"]')
      .click();

      settings()
      .find('[aria-label="Regular Expression pattern"]')
      .val('foo|bar').trigger('input');

      settings()
      .find('[aria-label="Regular Expression flags"]')
      .val('i').trigger('input');

      clickSave();

      expect(scope.field.validations)
      .toEqual([{regexp: {pattern: 'foo|bar', flags: 'i'}}]);
      expect(validationsDoc(scope).get())
      .toEqual([{regexp: {pattern: 'foo|bar', flags: 'i'}}]);
    });

    it('can select predefined patterns');

    it('selects the correct initial view');

    it('changes view to "custom" on change', function() {
      scope.field.validation = {regexp: {pattern: ''}};
      openDialog();
      settings()
      .find('select[aria-label="Select pattern"]')
      .val('1');

      var selected = settings()
      .find('select[aria-label="Select pattern"] option:selected')
      .text();
      expect(selected).not.toEqual('Custom');

      settings()
      .find('[aria-label="Regular Expression pattern"]')
      .val('foo|bar').trigger('input');
      scope.$digest();

      selected = settings()
      .find('select[aria-label="Select pattern"]')
      .controller('ngModel')
      .$viewValue;
      expect(selected).toEqual('custom');
    });
  });


  describe('predefined values', function() {
    function enterKeypressEvent() {
      return $.Event('keydown', {keyCode: $.ui.keyCode.ENTER} );
    }

    function settings() {
      return dialog.domElement.find('[aria-label="Predefined Values"]');
    }

    it('can be added and enabled', function() {
      expect(scope.field.validations).toBeUndefined();

      settings()
      .find('[aria-label="Enable validation"]')
      .click();

      var valueInput = settings().find('[aria-label="Add a value"]');

      valueInput.val('a value').trigger(enterKeypressEvent());
      expect(valueInput.val()).toBe('');

      valueInput.val('another value').trigger(enterKeypressEvent());

      clickSave();
      expect(scope.field.validations).toEqual([{in: ['a value', 'another value']}]);
      expect(validationsDoc(scope).get()).toEqual([{in: ['a value', 'another value']}]);
    });

    it('shows warning for existing values', function() {
      settings()
      .find('[aria-label="Enable validation"]')
      .click();

      var valueInput = settings().find('[aria-label="Add a value"]');
      valueInput
      .val('a value').trigger(enterKeypressEvent())
      .val('a value').trigger(enterKeypressEvent());
      scope.$digest();

      var errors = settings().find('[aria-label="Errors"] li');
      expect(errors.text()).toEqual('This value already exists on the list');

      clickSave();
      expect(scope.field.validations).toEqual([{in: ['a value']}]);
      expect(validationsDoc(scope).get()).toEqual([{in: ['a value']}]);
    });

    it('shows existing values', function() {
      scope.field.validations = [{in: ['a value', 'another value']}];
      openDialog();

      var values = settings().find('[aria-label="List of predefined values"] > li');
      var valuesText = values.map(function(_, li) {
        return $(li).text();
      }).get();

      expect(valuesText).toEqual(['a value', 'another value']);
    });

    it('can delete existing values', function() {
      scope.field.validations = [{in: ['a value', 'another value', 'even more value']}];
      openDialog();

      dialog.domElement
      .find('[aria-label="List of predefined values"]')
      .find('li:contains(another value)')
      .find('[aria-label="Remove value"]')
      .click();

      clickSave();
      expect(scope.field.validations).toEqual([{in: ['a value', 'even more value']}]);
      expect(validationsDoc(scope).get()).toEqual([{in: ['a value', 'even more value']}]);
    });

    describe('for number field', function() {
      beforeEach(function() {
        scope.field.type = 'Number';
        scope.field.validations = [{in: []}];
        openDialog();
      });

      it('parses number', function() {
        settings()
        .find('[aria-label="Add a value"]')
        .val('12.34').trigger(enterKeypressEvent());

        clickSave();
        expect(scope.field.validations).toEqual([{in: [12.34]}]);
      });

      it('warns if input is not a number', function() {
        settings()
        .find('[aria-label="Add a value"]')
        .val('not a number').trigger(enterKeypressEvent());

        var errors = settings().find('[aria-label="Errors"] li');
        expect(errors.text()).toEqual('You can only add number values.');
      });
    });
  });

  describe('content type validation', function() {
    function settings() {
      return dialog.domElement.find('[aria-label="Content Type"]');
    }

    beforeEach(function() {
      scope.field.type = 'Link';
      scope.field.linkType = 'Entry';
      scope.spaceContext = {
        publishedContentTypes: [{
          getId:   sinon.stub().returns('1'),
          getName: sinon.stub().returns('CT 1')
        }, {
          getId:   sinon.stub().returns('2'),
          getName: sinon.stub().returns('CT 2')
        }, {
          getId:   sinon.stub().returns('3'),
          getName: sinon.stub().returns('CT 3')
        }]
      };
      scope.$digest();
      openDialog();
    });

    it('can select content types', function() {
      scope.field.validations = [{linkContentType: ['1']}];
      openDialog();

      settings()
      .find('[aria-label="Enable validation"]')
      .click();

      var ct1Checkbox = settings()
      .find('label:contains("CT 1") input');
      expect(ct1Checkbox.is(':checked')).toBe(true);

      ct1Checkbox.click();
      settings()
      .find('label:contains("CT 2") input')
      .click();
      settings()
      .find('label:contains("CT 3") input')
      .click();

      clickSave();
      expect(scope.field.validations).toEqual([{linkContentType: ['2', '3']}]);
      expect(validationsDoc(scope).get()).toEqual([{linkContentType: ['2', '3']}]);
    });
  });

  describe('asset type validation', function() {
    function settings() {
      return dialog.domElement.find('[aria-label="File Type"]');
    }

    beforeEach(function() {
      scope.field.type = 'Link';
      scope.field.linkType = 'Asset';
      openDialog();
    });

    it('can select file type', function() {
      settings()
      .find('[aria-label="Enable validation"]')
      .click();

      settings()
      .find('label:contains("Image") input')
      .click();

      settings()
      .find('label:contains("Code") input')
      .click();

      clickSave();
      expect(scope.field.validations).toEqual([{linkMimetypeGroup: ['image', 'code']}]);
      expect(validationsDoc(scope).get()).toEqual([{linkMimetypeGroup: ['image', 'code']}]);
    });

    it('shows previously selected type', function() {
      scope.field.validations = [{linkMimetypeGroup: 'markup'}];
      openDialog();
      var selected = settings()
      .find('label:contains("Markup") input');
      expect(selected.is(':checked')).toBe(true);
    });

    it('shows error if no type slected', function() {
      scope.field.validations = [{linkMimetypeGroup: 'markup'}];
      openDialog();
      settings()
      .find('label:contains("Markup") input')
      .click();

      clickSave();
      var errors = settings()
      .find('[aria-label="Errors"] li');
      expect(errors.length).toEqual(1);
    });
  });

  describe('array length validation', function() {
    beforeEach(function() {
      scope.otEditable = true;
      scope.field = {type: 'Array', items: {type: 'Symbol'}};
      openDialog();
    });

    function settings() {
      return dialog.domElement.find('[aria-label="Enforce number of Symbols"]');
    }

    it('can be set', function() {
      settings()
      .find('[aria-label="Enable validation"]')
      .click();

      var minInput = settings().find('[aria-label="Minimum size"]');
      minInput.val('10').trigger('input');
      var maxInput = settings().find('[aria-label="Maximum size"]');
      maxInput.val('20').trigger('input');

      clickSave();
      expect(dialog.open).toBe(false);

      expect(scope.field.validations)
      .toEqual([{size: {min: 10, max: 20}}]);
      expect(validationsDoc(scope).get())
      .toEqual([{size: {min: 10, max: 20}}]);
    });

  });
});
