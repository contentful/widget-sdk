'use strict';

describe('translatorLocaleSelector directive', function () {

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });

    this.internalRoleRepesentation = {
      name: 'Translator A',
      assets: {
        allowed: [
          {action: 'read'},
          {action: 'update', locale: 'de'}
        ]
      },
      entries: {
        allowed: [
          {action: 'read'},
          {action: 'update', locale: 'de'}
        ]
      }
    };
    this.compile = function () {
      this.element = this.$compile(
        '<cf-translator-locale-selector policies="internal"/>',
        {internal: this.internalRoleRepesentation}
      );
    };
  });

  describe('locale dropdown', function () {
    it('dropdown populates locales', function () {
      this.compile();
      var options = this.element.find('option');
      expect(options.length).toBe(3);
      expect(options[0].innerHTML).toBe('All locales');
      expect(options[1].innerHTML).toBe('English (en)');
      expect(options[2].innerHTML).toBe('German (de)');
    });

    it('preselect first permitted locale', function () {
      this.compile();
      var selected = this.element.find('option[selected="selected"]')[0];
      expect(selected.innerHTML).toBe('German (de)');
    });

    it('preselect all locales', function () {
      var ALL_LOCALES = this.$inject('PolicyBuilder/CONFIG').ALL_LOCALES;
      this.internalRoleRepesentation.entries.allowed[1].locale = ALL_LOCALES;
      this.internalRoleRepesentation.assets.allowed[1].locale = ALL_LOCALES;
      this.compile();
      var selected = this.element.find('option[selected="selected"]')[0];
      expect(selected.innerHTML).toBe('All locales');
    });


  });

  describe('toggle locale', function () {
    it('updates scope', function () {
      this.compile();
      var select = this.element.find('select');
      select.val('string:en');
      select.trigger('change');
      expect(this.internalRoleRepesentation.entries.allowed[1].locale).toBe('en');
      expect(this.internalRoleRepesentation.assets.allowed[1].locale).toBe('en');
    });
  });
});
