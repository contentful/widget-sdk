'use strict';

/**
 * Tests the following controller and directives
 *
 * - `FieldValidationDialogController`
 * - `cfValidationsettings`
 * - `cfValidationValues`
 * - `cfValidationLinkType`
 *
 * Stubs the scope's `field`, `index` and `otDoc` and the notifictaion
 * service.
 */
describe('validation dialog', function() {
  var openDialog, dialog, scope, notification;

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
      notification = $injector.get('notification');
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


  describe('length validation', function() {

    it('can be enabled and set', function() {
      var settings = dialog.domElement.find('[aria-label=Length]');
      expect(settings.find('.validation-controls').is(':hidden')).toBe(true);

      settings
      .find('[aria-label="Enable validation"]')
      .click();
      expect(settings.find('.validation-controls').is(':hidden')).toBe(false);

      var minInput = settings.find('[aria-label="Minimum size"]');
      minInput.val('10').trigger('input');
      var maxInput = settings.find('[aria-label="Maximum size"]');
      maxInput.val('20').trigger('input');

      expect(scope.field.validations)
      .toEqual([{size: {min: 10, max: 20}}]);
      expect(validationsDoc(scope).get())
      .toEqual([{size: {min: 10, max: 20}}]);
    });

    it('can be toggled', function() {
      expect(scope.field.validations).toBeUndefined();
      var settings = dialog.domElement.find('[aria-label=Length]');
      settings
      .find('[aria-label="Enable validation"]')
      .click();
      expect(scope.field.validations.length).toBe(1);
      expect(validationsDoc(scope).get().length).toBe(1);

      settings
      .find('[aria-label="Disable validation"]')
      .click();
      expect(scope.field.validations).toEqual([]);
      expect(validationsDoc(scope).get()).toEqual([]);
    });

    it('existing validation is shown', function() {
      scope.field.validations = [{size: {min: 10, max: 20}}];
      openDialog();

      var settings = dialog.domElement.find('[aria-label=Length]');
      var minInput = settings.find('[aria-label="Minimum size"]');
      expect(minInput.val()).toBe('10');
      var maxInput = settings.find('[aria-label="Maximum size"]');
      expect(maxInput.val()).toBe('20');

      settings
      .find('[aria-label="Disable validation"]')
      .click();
      expect(scope.field.validations).toEqual([]);
      expect(validationsDoc(scope).get()).toEqual([]);
    });

  });

  describe('range validation', function() {

    beforeEach(function() {
      scope.field.type = 'Number';
      openDialog();
    });

    function settings() {
      return dialog.domElement.find('[aria-label="Numerical Range"]');
    }

    it('can be enabled and set', function() {
      settings()
      .find('[aria-label="Enable validation"]')
      .click();

      var minValue = settings().find('[aria-label="Minimum value"]');
      minValue.val('-0.1').trigger('input');
      var maxValue = settings().find('[aria-label="Maximum value"]');
      maxValue.val('0.2').trigger('input');

      expect(scope.field.validations)
      .toEqual([{range: {min: -0.1, max: 0.2}}]);
      expect(validationsDoc(scope).get())
      .toEqual([{range: {min: -0.1, max: 0.2}}]);
    });

    it('it can be disabled', function() {
      scope.field.validations = [{range: {min: 0.1, max: 0.2}}];
      openDialog();

      var minValue = settings().find('[aria-label="Minimum value"]');
      minValue.val('0.1').trigger('input');
      var maxValue = settings().find('[aria-label="Maximum value"]');
      maxValue.val('0.2').trigger('input');

      settings()
      .find('[aria-label="Disable validation"]')
      .click();
      expect(scope.field.validations).toEqual([]);
      expect(validationsDoc(scope).get()).toEqual([]);
    });

  });

  describe('regexp validation', function() {

    it('can be enabled and set', function() {
      var settings = dialog.domElement.find('[aria-label="Regular Expression"]');
      settings
      .find('[aria-label="Enable validation"]')
      .click();

      settings
      .find('[aria-label="Regular Expression pattern"]')
      .val('foo|bar').trigger('input');

      settings
      .find('[aria-label="Regular Expression flags"]')
      .val('i').trigger('input');

      expect(scope.field.validations)
      .toEqual([{regexp: {pattern: 'foo|bar', flags: 'i'}}]);
      expect(validationsDoc(scope).get())
      .toEqual([{regexp: {pattern: 'foo|bar', flags: 'i'}}]);
    });

  });


  describe('predefined values', function() {
    function enterKeypressEvent() {
      return $.Event('keypress', {keyCode: $.ui.keyCode.ENTER} );
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

      expect(scope.field.validations).toEqual([{in: ['a value']}]);
      expect(validationsDoc(scope).get()).toEqual([{in: ['a value']}]);
      expect(valueInput.val()).toBe('');

      valueInput.val('another value').trigger(enterKeypressEvent());
      expect(scope.field.validations).toEqual([{in: ['a value', 'another value']}]);
      expect(validationsDoc(scope).get()).toEqual([{in: ['a value', 'another value']}]);
    });

    it('shows warning for existing values', function() {
      notification.warn = sinon.stub();
      settings()
      .find('[aria-label="Enable validation"]')
      .click();

      var valueInput = settings().find('[aria-label="Add a value"]');
      valueInput
      .val('a value').trigger(enterKeypressEvent())
      .val('a value').trigger(enterKeypressEvent());

      expect(notification.warn).toBeCalledWith('This value already exists on the list');
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

        expect(scope.field.validations).toEqual([{in: [12.34]}]);
      });

      it('warns if input is not a number', function() {
        settings()
        .find('[aria-label="Add a value"]')
        .val('not a number').trigger(enterKeypressEvent());

        expect(notification.warn).toBeCalledWith('You can only add number values.');
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

      var selected = settings()
      .find('option:selected');
      expect(selected.text()).toEqual('');

      settings()
      .find('select')
      .val('image')
      .trigger('change');

      expect(scope.field.validations).toEqual([{linkMimetypeGroup: 'image'}]);
      expect(validationsDoc(scope).get()).toEqual([{linkMimetypeGroup: 'image'}]);
    });

    it('shows previously selected type', function() {
      scope.field.validations = [{linkMimetypeGroup: 'markup'}];
      openDialog();
      var selected = settings()
      .find('option:selected');
      expect(selected.text()).toEqual('Markup');
    });
  });
});
