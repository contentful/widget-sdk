'use strict';

describe('translatorLocaleSelector directive', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });

    this.internalRoleRepesentation = {
      name: 'Translator A',
      assets: {
        allowed: [{ action: 'read' }, { action: 'update', locale: 'de' }]
      },
      entries: {
        allowed: [{ action: 'read' }, { action: 'update', locale: 'de' }]
      }
    };
    this.compile = function(hasFeatureEnabled = false) {
      this.element = this.$compile(
        '<cf-translator-locale-selector policies="internal" has-feature-enabled="hasFeatureEnabled"/>',
        { internal: this.internalRoleRepesentation, hasFeatureEnabled }
      );
    };
  });

  describe('locale dropdown', () => {
    it('dropdown populates locales', function() {
      this.compile();
      const options = this.element.find('option');
      expect(options.length).toBe(3);
      expect(options[0].innerHTML).toBe('All locales');
      expect(options[1].innerHTML).toBe('English (en)');
      expect(options[2].innerHTML).toBe('German (de)');
    });

    it('preselect first permitted locale', function() {
      this.compile();
      const selected = this.element.find('option[selected="selected"]')[0];
      expect(selected.innerHTML).toBe('German (de)');
    });

    it('shows a message if custom roles feature is not enabled', function() {
      this.compile();
      expect(this.element.find('.advice__note').length).toBe(1);
    });

    it('does not show a message if custom roles feature is enabled', function() {
      this.compile(true);
      expect(this.element.find('.advice__note').length).toBe(0);
    });

    it('preselect all locales', function() {
      const ALL_LOCALES = this.$inject('PolicyBuilder/CONFIG').ALL_LOCALES;
      this.internalRoleRepesentation.entries.allowed[1].locale = ALL_LOCALES;
      this.internalRoleRepesentation.assets.allowed[1].locale = ALL_LOCALES;
      this.compile();
      const selected = this.element.find('option[selected="selected"]')[0];
      expect(selected.innerHTML).toBe('All locales');
    });
  });

  describe('toggle locale', () => {
    it('updates scope', function() {
      this.compile();
      const select = this.element.find('select');
      select.val('string:en');
      select.trigger('change');
      expect(this.internalRoleRepesentation.entries.allowed[1].locale).toBe('en');
      expect(this.internalRoleRepesentation.assets.allowed[1].locale).toBe('en');
    });
  });
});
