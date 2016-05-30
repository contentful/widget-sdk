'use strict';

describe('cfEntityField directive integration', function () {

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
      $provide.removeDirectives('otPath', 'cfWidgetApi', 'cfWidgetRenderer');
    });

    var TheLocaleStore = this.$inject('TheLocaleStore');
    this.setLocales = TheLocaleStore.setLocales;
    this.setLocales([
      {code: 'DEF', name: 'Default'},
      {code: 'EN', name: 'English'}
    ]);

    this.widget = {
      field: {
        id: 'FID',
        localized: true,
        name: 'FIELD NAME'
      },
      settings: {}
    };

    this.validator = {
      hasError: sinon.stub().returns(false)
    };

    this.compile = function () {
      return this.$compile('<cf-entity-field>', {
        widget: this.widget,
        validator: this.validator,
        entry: {}
      });
    };
  });

  describe('labels', function () {

    it('shows field name for single locale', function () {
      this.setLocales([{code: 'EN'}]);
      var el = this.compile();
      var label = el.find('[data-test-id="field-locale-label"]');
      expect(label.length).toEqual(1);
      expect(label.text()).toEqual('FIELD NAME');
    });

    it('shows "required" if field is required', function () {
      this.widget.field.required = true;
      var el = this.compile();
      var labels = el.find('[data-test-id="field-locale-label"]');
      expect(labels.length).toEqual(2);
      labels.each(function () {
        expect($(this).text()).toMatch('(required)');
      });
    });

    it('does not show "required" if a locale is optional', function () {
      this.setLocales([
        {code: 'DEF', name: 'Default'},
        {code: 'EN', name: 'English', optional: true}
      ]);
      this.widget.field.required = true;
      var el = this.compile();
      var labels = el.find('[data-test-id="field-locale-label"]');
      expect(labels.eq(0).text()).toMatch('(required)');
      expect(labels.eq(1).text()).not.toMatch('(required)');
    });

    it('shows locale name for multiple locales', function () {
      this.widget.field.required = true;
      var el = this.compile();
      var labels = el.find('[data-test-id="field-locale-label"]');
      expect(labels.length).toEqual(2);
      expect(labels.eq(0).text()).toMatch('Default');
      expect(labels.eq(1).text()).toMatch('English');
    });

  });

  describe('editing permissions', function () {
    it('shows message if user does not have editing permissions', function () {
      var accessChecker = this.$inject('accessChecker');
      accessChecker.getFieldChecker = sinon.stub().returns({
        isEditable: function (_field, locale) {
          return locale.code === 'EN';
        }
      });

      var el = this.compile();
      expect(findPermissionInfo(el, 'EN')).toBeNgHidden();
      expect(findPermissionInfo(el, 'DEF')).not.toBeNgHidden();
    });

    function findPermissionInfo (parent, locale) {
      return parent.find('[data-locale]')
      .filter(function () {
        return $(this).data('locale') === locale;
      }).find('[data-test-id="field-locale-permissions"]');
    }
  });

  describe('hint', function () {
    it('shows widget default helpt text', function () {
      this.widget.defaultHelpText = 'HELP TEXT';
      var hint = this.compile().find('[data-test-id=field-hint]');
      expect(hint.length).toBe(1);
      expect(hint.text()).toEqual('HELP TEXT');
    });

    it('shows custom widget settings help text', function () {
      this.widget.defaultHelpText = 'DEFAULT';
      this.widget.settings.helpText = 'HELP TEXT';
      var hint = this.compile().find('[data-test-id=field-hint]');
      expect(hint.length).toBe(1);
      expect(hint.text()).toEqual('HELP TEXT');
    });

    it('does not show hint if widget renders it', function () {
      this.widget.settings.helpText = 'HELP TEXT';
      this.widget.rendersHelpText = true;
      var hint = this.compile().find('[data-test-id=field-hint]');
      expect(hint.length).toBe(0);
    });
  });

  describe('visible locales', function () {

    it('only shows default locale when field is not localized', function () {
      this.setLocales([
        {code: 'en'}, {code: 'de'}, {code: 'fr'}
      ]);
      this.widget.field.localized = false;
      var el = this.compile();
      expect(getDataLocaleAttr(el)).toEqual(['en']);
    });

    it('responds to changing the active locales', function () {
      this.setLocales([
        {code: 'en'},
        {code: 'de', active: false},
        {code: 'fr'}
      ]);
      var el = this.compile();
      expect(getDataLocaleAttr(el)).toEqual(['en', 'fr']);
      this.setLocales([
        {code: 'en'},
        {code: 'de'}
      ]);
      this.$apply();
      expect(getDataLocaleAttr(el)).toEqual(['en', 'de']);
    });

    it('adds locales with error', function () {
      this.setLocales([
        {code: 'en'},
        {code: 'de', active: false},
        {code: 'fr', active: false}
      ]);

      var el = this.compile();
      expect(getDataLocaleAttr(el)).toEqual(['en']);

      this.validator.hasError
        .withArgs(sinon.match(['fields', 'FID', 'de-internal']))
        .returns(true);
      // we need to fire a watcher.
      this.validator.errors = {};
      this.$apply();

      expect(getDataLocaleAttr(el)).toEqual(['en', 'de']);
    });

    function getDataLocaleAttr (el) {
      return el.find('[data-locale]').map(function () {
        return $(this).data('locale');
      }).get();
    }
  });

  describe('errors', function () {
    it('shows field locale errors', function () {
      var el = this.compile();
      expect(hasErrorStatus(el)).toBe(false);

      el.scope().validationResult = {
        errors: [
          {path: ['fields', 'FID', 'DEF-internal'], name: 'def-error'},
          {path: ['fields', 'FID', 'EN-internal'], name: 'en-error-1'},
          {path: ['fields', 'FID', 'EN-internal'], name: 'en-error-2'}
        ]
      };
      this.$apply();

      var defLocale = el.find('[data-locale=DEF]');
      expect(hasErrorStatus(defLocale, 'entry.schema.def-error')).toBe(true);

      var enLocale = el.find('[data-locale=EN]');
      expect(hasErrorStatus(enLocale, 'entry.schema.en-error-1')).toBe(true);
      expect(hasErrorStatus(enLocale, 'entry.schema.en-error-2')).toBe(true);
    });
  });

  function hasErrorStatus (el, errorCode) {
    var selector = '[role="status"]';
    if (errorCode) {
      selector += '[data-error-code^="' + errorCode + '"]';
    }
    return el.find(selector).length > 0;
  }
});
