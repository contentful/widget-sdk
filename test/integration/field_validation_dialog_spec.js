import * as K from 'utils/kefir';

/**
 * Tests the following controller and directives
 *
 * - `FieldValidationDialogController`
 * - `cfValidationsettings`
 * - `cfValidationValues`
 * - `cfValidationLinkType`
 * - `cfValidationDateSelect`
 *
 * Stubs the scope's `field`, `index`, and `otDoc`.
 */
xdescribe('validation dialog', function() {
  var openDialog, dialog, scope;

  function getFieldProperty(scope, path) {
    return _.get(scope, ['field', path].join('.'));
  }

  function setFieldProperty(scope, path, value) {
    return _.set(scope, ['field', path].join('.'), value);
  }

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

    scope.otDoc = {state: {editable: true}};
    scope.field = {type: 'Text'};
    scope.index = 1;
    scope.contentTypeForm = {$setDirty: sinon.stub()};

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


  describe('text length validation', function() {
    beforeEach(function() {
      scope.field.type = 'Text';
      openDialog();
    });

    describeLengthValidation('validations');
  });

  describe('multiple symbols length validation', function() {
    beforeEach(function() {
      scope.field.type = 'Array';
      scope.field.items = {type: 'Symbol'};
      openDialog();
    });

    describeLengthValidation('items.validations');
  });

  function describeLengthValidation(validationPath) {

    function settings() {
      return dialog.domElement.find('[aria-label="Enforce input length"]');
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

      expect(getFieldProperty(scope, validationPath))
      .toEqual([{size: {min: 10, max: 20}}]);
    });

    it('existing validation is shown and can be disabled', function() {
      setFieldProperty(scope, validationPath, [{size: {min: 10, max: 20}}]);
      openDialog();

      var minInput = settings().find('[aria-label="Minimum size"]');
      expect(minInput.val()).toBe('10');
      var maxInput = settings().find('[aria-label="Maximum size"]');
      expect(maxInput.val()).toBe('20');

      settings()
      .find('[aria-label="Disable validation"]')
      .click();
      clickSave();
      expect(getFieldProperty(scope, validationPath)).toEqual([]);
    });

    it('shows errors when opened', function() {
      setFieldProperty(scope, validationPath, [{size: {min: null, max: null}}]);
      openDialog();

      clickSave();
      expect(dialog.open).toBe(true);

      var errors = settings()
      .find('[aria-label="Errors"] li');
      expect(errors.text()).toEqual('Please provide a positive integer');
    });

    it('does not save invalid validations', function() {
      setFieldProperty(scope, validationPath, [{size: {min: 10, max: null}}]);
      openDialog();

      settings()
      .find('[aria-label="Minimum size"]')
      .val('')
      .trigger('input');

      clickSave();
      expect(dialog.open).toBe(true);

      var errors = settings()
      .find('[aria-label="Errors"] li');
      expect(errors.text()).toEqual('Please provide a positive integer');
    });

    it('selects the correct initial view', function() {
      setFieldProperty(scope, validationPath, [{size: {min: 10, max: null}}]);
      openDialog();

      var selectedView = settings()
      .find('select[aria-label="Select condition"]')
      .find('option:selected').text();
      expect(selectedView).toEqual('At least');
    });

    it('changes custom error message', function() {
      setFieldProperty(scope, validationPath, [{
        size: {min: 10, max: null},
        message: 'my custom error message'
      }]);
      openDialog();

      var errorMessage = settings()
      .find('input[aria-label="Custom error message"]');
      expect(errorMessage.val()).toEqual('my custom error message');

      errorMessage.val('a new error message').trigger('input');
      clickSave();
      expect(getFieldProperty(scope, validationPath)).toEqual([{
        size: {min: 10},
        message: 'a new error message'
      }]);
    });

  }

  describe('range validation', function() {
    beforeEach(function() {
      scope.field.type = 'Number';
      openDialog();
    });

    function settings() {
      return dialog.domElement.find('[aria-label="Specify allowed number range"]');
    }

    it('can be enabled and set', function() {
      settings()
      .find('[aria-label="Enable validation"]')
      .click();
      settings()
      .find('[aria-label="Enable validation"]')
      .click();

      var minValue = settings().find('[aria-label="Minimum value"]');
      minValue.val('-0.1').trigger('input');
      var maxValue = settings().find('[aria-label="Maximum value"]');
      maxValue.val('0.1').trigger('input');

      clickSave();

      expect(scope.field.validations)
      .toEqual([{range: {min: -0.1, max: 0.1}}]);
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
    });

  });

  describe('regexp validation', function() {
    function settings() {
      return dialog.domElement.find('[aria-label="Match a specific pattern"]');
    }

    function enable() {
      settings()
      .find('[aria-label="Enable validation"]')
      .click();
    }

    it('can be enabled and set', function() {
      enable();

      settings()
      .find('[aria-label="Regular Expression pattern"]')
      .val('foo|bar').trigger('input');

      settings()
      .find('[aria-label="Regular Expression flags"]')
      .val('i').trigger('input');

      clickSave();

      expect(scope.field.validations)
      .toEqual([{regexp: {pattern: 'foo|bar', flags: 'i'}}]);
    });

    it('shows error for invalid flags', function () {
      enable();

      settings()
      .find('[aria-label="Regular Expression pattern"]')
      .val('foo|bar').trigger('input');

      settings()
      .find('[aria-label="Regular Expression flags"]')
      .val('x').trigger('input');

      clickSave();

      var errors = settings().find('[aria-label="Errors"]').text();
      expect(errors).toEqual('Please provide a valid regular expression with valid flags');
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
      return dialog.domElement.find('[aria-label="Predefined values"]');
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
      return dialog.domElement.find('[aria-label="Specify allowed entry type"]');
    }

    beforeEach(function() {
      scope.field.type = 'Link';
      scope.field.linkType = 'Entry';
      scope.spaceContext = {
        publishedCTs: {
          items$: K.createMockProperty([{
            getId:   sinon.stub().returns('1'),
            getName: sinon.stub().returns('CT 1')
          }, {
            getId:   sinon.stub().returns('2'),
            getName: sinon.stub().returns('CT 2')
          }, {
            getId:   sinon.stub().returns('3'),
            getName: sinon.stub().returns('CT 3')
          }])
        }
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
    });
  });

  describe('asset type validation', function() {
    function settings() {
      return dialog.domElement.find('[aria-label="Specify allowed file types"]');
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
      scope.otDoc = {state: {editable: true}};
      scope.field = {type: 'Array', items: {type: 'Symbol'}};
      openDialog();
    });

    function settings() {
      return dialog.domElement.find('[aria-label="Specify number of Symbols"]');
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
    });

  });

  describe('file size validation', function() {
    beforeEach(function() {
      scope.field = {type: 'Link', linkType: 'Asset'};
      openDialog();
    });

    function settings(locator) {
      return dialog.domElement
      .find('[aria-label="Specify allowed file size"]')
      .find(locator);
    }

    it('can be set', function() {
      settings('[aria-label="Enable validation"]')
      .click();

      settings('[aria-label="Select condition"]').val('min');

      var minInput = settings('[aria-label="Minimum size"]');
      minInput.val('2').trigger('input');

      var minScaleInput = settings('[aria-label="Select size unit"]');
      minScaleInput.val('1').trigger('change');

      clickSave();
      expect(dialog.open).toBe(false);

      expect(scope.field.validations)
      .toEqual([{assetFileSize: {min: 2048, max: null}}]);
    });

    it('selects "at least" as initial view and changes to between', function () {
      scope.field.validations = [{assetFileSize: {min: 1}}];
      openDialog();

      var condition = settings('[aria-label="Select condition"] option:selected').text();
      expect(condition).toBe('At least');

      settings('[aria-label="Select condition"]')
      .val('0').trigger('change');

      settings('[aria-label="Maximum size"]')
      .val('2').trigger('input');

      clickSave();
      expect(dialog.open).toBe(false);

      expect(scope.field.validations)
      .toEqual([{assetFileSize: {min: 1, max: 2}}]);
    });
  });

  describe('image dimension validations', function () {
    beforeEach(function() {
      scope.field = {type: 'Link', linkType: 'Asset'};
      openDialog();
    });

    function settings(selector) {
      return dialog.domElement
      .find('[aria-label="Specify image dimensions"]')
      .find(selector);
    }

    it('can set width minimum and exact height', function () {
      settings('[aria-label="Enable validation"]')
      .click();

      settings('input[aria-label="Enable image width validation"]')
      .click();

      settings('[aria-label="Minimum image width"]')
      .val('100').trigger('input');

      settings('input[aria-label="Enable image height validation"]')
      .click();

      settings('select[aria-label="Select image height condition"]')
      .val('exact').trigger('change');

      settings('input[aria-label="Exact image height"]')
      .val('200').trigger('input');

      clickSave();

      expect(scope.field.validations)
      .toEqual([{assetImageDimensions: {
        width: {min: 100, max: null},
        height: {min: 200, max: 200},
      }}]);
    });
  });
});
