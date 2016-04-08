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
      {internal_code: 'DEF', name: 'Default'},
      {internal_code: 'EN', name: 'English'},
    ]);

    this.widget = {
      field: {
        id: 'FID',
        localized: true,
        name: 'FIELD NAME'
      },
      settings: {}
    };

    this.compile = function () {
      return this.$compile('<cf-entity-field>', {
        widget: this.widget
      });
    };
  });

  describe('labels', function () {

    it('shows field name for single locale', function () {
      this.setLocales([{internal_code: 'EN'}]);
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
    it('shows message if field is locked', function () {
      var el = this.compile();
      var scope = el.scope();
      dotty.put(scope, 'otDoc.state.editable', true);
      scope.isDisabled = function (field, locale) {
        return locale.internal_code === 'EN';
      };
      this.$apply();

      var info = el.find('[data-test-id="field-locale-permissions"]');
      expect(info.length).toEqual(2);
      expect(info.eq(0).is('.ng-hide')).toBe(true);
      expect(info.eq(1).is('.ng-hide')).toBe(false);
    });
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
        {code: 'en'}, {code: 'de'}, {code: 'fr'},
      ]);
      this.widget.field.localized = false;
      var el = this.compile();
      expect(getDataLocaleAttr(el)).toEqual(['en']);
    });

    it('responds to changing the active locales', function () {
      this.setLocales([
        {code: 'en'},
        {code: 'de', active: false},
        {code: 'fr'},
      ]);
      var el = this.compile();
      expect(getDataLocaleAttr(el)).toEqual(['en', 'fr']);
      this.setLocales([
        {code: 'en'},
        {code: 'de'},
      ]);
      this.$apply();
      expect(getDataLocaleAttr(el)).toEqual(['en', 'de']);
    });

    it('adds locales with error', function () {
      this.setLocales([
        {code: 'en'},
        {code: 'de', active: false, internal_code: 'de-internal'},
      ]);
      var el = this.compile();
      expect(getDataLocaleAttr(el)).toEqual(['en']);
      el.scope().errorPaths = {
        'FID': ['de-internal']
      };
      this.$apply();
      expect(getDataLocaleAttr(el)).toEqual(['en', 'de']);
    });

    function getDataLocaleAttr (el) {
      return el.find('[data-locale]').map(function () {
        return $(this).data('locale');
      }).get();
    }
  });
});
