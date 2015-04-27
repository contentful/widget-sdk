'use strict';

describe('The cfFieldSettingsEditor directive', function () {

  var container, scope, stubs;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['isDisplayableAsTitleFilter']);
      $provide.removeControllers('FieldSettingsEditorController');
      $provide.removeDirectives('tooltip', 'otDocFor', 'otPath', 'otSubdoc', 'otBind', 'otBindText');
      $provide.value('isDisplayableAsTitleFilter', stubs.isDisplayableAsTitleFilter);
    });

    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();

      scope.field = {};

      compileElement = function () {
        container = $('<cf-field-settings-editor></cf-field-settings-editor>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(function () {
    container.remove();
  });

  describe('icons are displayed', function() {
    var icons;
    beforeEach(function() {
      scope.field = {
        required: true,
        localized: true
      };
      scope.index = 2;
      scope.validationResult = {
        pathErrors: {
          fields: {
            2: {}
          }
        }
      };
      scope.isDisplayField = sinon.stub();
      scope.isDisplayField.returns(true);
      scope.hasValidations = true;

      compileElement();
      icons = container.find('.icons');
    });

    it('validation alert', function() {
      expect(icons.find('.validation-alert')).not.toBeNgHidden();
    });

    it('field used as title', function() {
      expect(icons.find('.title-icon')).not.toBeNgHidden();
    });

    it('required', function() {
      expect(icons.find('.required-icon')).toHaveClass('enabled');
    });

    it('has validations', function() {
      expect(icons.find('.fa-check')).toHaveClass('enabled');
    });

    it('is localized', function() {
      expect(icons.find('.fa-globe')).toHaveClass('enabled');
    });
  });

  describe('icons are not displayed', function() {
    var icons;
    beforeEach(function() {
      scope.field = {};
      scope.index = 2;
      scope.validationResult = {};
      scope.isDisplayField = sinon.stub();
      scope.isDisplayField.returns(false);
      scope.hasValidations = false;

      compileElement();
      icons = container.find('.icons');
    });

    it('validation alert', function() {
      expect(icons.find('.validation-alert')).toBeNgHidden();
    });

    it('field used as title', function() {
      expect(icons.find('.title-icon')).toBeNgHidden();
    });

    it('required', function() {
      expect(icons.find('.required-icon')).not.toHaveClass('enabled');
    });

    it('has validations', function() {
      expect(icons.find('.fa-check')).not.toHaveClass('enabled');
    });

    it('is localized', function() {
      expect(icons.find('.fa-globe')).not.toHaveClass('enabled');
    });
  });

  describe('field details are active', function() {
    var details;
    beforeEach(function() {
      scope.field = {
        required: true,
        localized: true,
        disabled: true
      };
      scope.index = 2;
      scope.validationResult = {
        pathErrors: {
          fields: {
            2: {}
          }
        }
      };
      scope.isDisplayField = sinon.stub();
      scope.isDisplayField.returns(true);
      stubs.isDisplayableAsTitleFilter.returns(true);
      scope.hasValidations = true;
      scope.validationsAvailable = true;
      scope.published = true;

      compileElement();
      details = container.find('.field-details');
    });

    it('required', function() {
      expect(details.find('.toggle-required')).toHaveClass('active');
    });

    it('validate', function() {
      expect(details.find('.toggle-validate')).toHaveClass('active');
    });

    it('validate is shown', function() {
      expect(details.find('.toggle-validate')).not.toBeNgHidden();
    });

    it('localized', function() {
      expect(details.find('.toggle-localized')).toHaveClass('active');
    });

    it('title', function() {
      expect(details.find('.toggle-title')).toHaveClass('active');
    });

    it('title is shown', function() {
      expect(details.find('.toggle-title')).not.toBeNgHidden();
    });

    it('disabled', function() {
      expect(details.find('.toggle-disabled').eq(0)).toHaveClass('active');
    });

    it('disable is shown', function() {
      expect(details.find('.toggle-disabled').eq(0)).not.toBeNgHidden();
    });

    it('delete is not shown', function() {
      expect(details.find('.toggle-disabled').eq(1)).toBeNgHidden();
    });
  });

  describe('field details are not active', function() {
    var details;
    beforeEach(function() {
      scope.field = {};
      scope.index = 2;
      scope.validationResult = {};
      scope.isDisplayField = sinon.stub();
      scope.isDisplayField.returns(false);
      stubs.isDisplayableAsTitleFilter.returns(false);
      scope.hasValidations = false;
      scope.validationsAvailable = false;

      compileElement();
      details = container.find('.field-details');
    });

    it('required', function() {
      expect(details.find('.toggle-required')).not.toHaveClass('active');
    });

    it('validate', function() {
      expect(details.find('.toggle-validate')).not.toHaveClass('active');
    });

    it('validate is not shown', function() {
      expect(details.find('.toggle-validate')).toBeNgHidden();
    });

    it('localized', function() {
      expect(details.find('.toggle-localized')).not.toHaveClass('active');
    });

    it('title', function() {
      expect(details.find('.toggle-title')).not.toHaveClass('active');
    });

    it('title is not shown', function() {
      expect(details.find('.toggle-title')).toBeNgHidden();
    });

    it('disable is not shown', function() {
      expect(details.find('.toggle-disabled').eq(0)).toBeNgHidden();
    });

    it('delete is shown', function() {
      expect(details.find('.toggle-disabled').eq(1)).not.toBeNgHidden();
    });
  });


});
