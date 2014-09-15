'use strict';

describe('The cfFieldSettings directive', function () {

  var container, scope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('tooltip', 'otDocFor', 'otPath', 'otSubdoc', 'otBind', 'otBindText');
    });

    function ControllerMock(){}
    inject(function ($rootScope, $compile, cfFieldSettingsDirective) {
      cfFieldSettingsDirective[0].controller = ControllerMock;
      scope = $rootScope.$new();

      scope.field = {};

      compileElement = function () {
        container = $('<div class="cf-field-settings"></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

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
      expect(icons.find('.fa-header')).not.toBeNgHidden();
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
      expect(icons.find('.fa-header')).toBeNgHidden();
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

  describe('field id', function() {
    describe('if published', function() {
      beforeEach(function() {
        scope.published = true;
        compileElement();
      });

      it('rendered for reading', function() {
        expect(container.find('.field-id-display').get(0)).toBeDefined();
      });

      it('not rendered for editing', function() {
        expect(container.find('.field-form input[name=fieldId]').get(0)).not.toBeDefined();
      });
    });

    describe('if not published', function() {
      beforeEach(function() {
        scope.published = false;
        compileElement();
      });

      it('not rendered for reading', function() {
        expect(container.find('.field-id-display').get(0)).not.toBeDefined();
      });

      it('rendered for editing', function() {
        expect(container.find('.field-form input[name=fieldId]').get(0)).toBeDefined();
      });
    });
  });

  it('hides field errors if no errors exist', function() {
    scope.noErrors = true;
    compileElement();
    expect(container.find('.field-errors')).toBeNgHidden();
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
      scope.displayEnabled = sinon.stub();
      scope.displayEnabled.returns(true);
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
      scope.displayEnabled = sinon.stub();
      scope.displayEnabled.returns(false);
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
