import $q from '$q';
import * as DOM from 'helpers/DOM';

/**
 * Tests the integration of the 'cfEntityField' directive with
 *
 * - 'FieldLocaleController'
 *
 * Mocks the 'EntryEditorController' which serves as the context for
 * 'cfEntityField'.
 *
 * Does not render the widget.
 *
 * TODO Use DOM helpers
 */
describe('entity editor field integration', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
      $provide.removeDirectives('cfWidgetApi', 'cfWidgetRenderer');
    });

    const TheLocaleStore = this.$inject('TheLocaleStore');
    this.setLocales = TheLocaleStore.setLocales;
    this.setLocales([
      {code: 'DEF', name: 'Default'},
      {code: 'EN', name: 'English'}
    ]);

    this.widget = {
      isVisible: true,
      field: {
        id: 'FID',
        localized: true,
        name: 'FIELD NAME'
      },
      settings: {}
    };

    const spaceContext = this.mockService('spaceContext', {
      entryTitle (entry) {
        return `TITLE ${entry.data.sys.id}`;
      }
    });

    spaceContext.space = {
      getEntries (query) {
        const ids = query['sys.id[in]'].split(',');
        return $q.resolve(ids.map((id) => {
          return {data: {sys: {id: id, type: 'Entry'}}};
        }));
      }
    };

    spaceContext.user = { sys: { id: 'user-id-from-space-context' } };

    const editorContext = this.$inject('mocks/entityEditor/Context').create();
    this.focus = editorContext.focus;

    this.validator = editorContext.validator;

    this.compile = function () {
      this.otDoc = this.otDoc || this.$inject('mocks/entityEditor/Document').create();
      const el = this.$compile('<cf-entity-field>', {
        widget: this.widget,
        editorContext: editorContext,
        otDoc: this.otDoc,
        entry: {}
      });
      el.fieldController = el.scope().fieldController;
      el.field = el.find('[data-test-id="entity-field-controls"]');
      return el;
    };
  });

  describe('labels', function () {
    it('shows field name for single locale', function () {
      this.setLocales([{code: 'EN'}]);
      const el = this.compile();
      const label = el.find('[data-test-id="field-locale-label"]');
      expect(label.length).toEqual(1);
      expect(label.text()).toEqual('FIELD NAME');
    });

    it('shows "required" if field is required', function () {
      this.widget.field.required = true;
      const el = this.compile();
      const labels = el.find('[data-test-id="field-locale-label"]');
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
      const el = this.compile();
      const labels = el.find('[data-test-id="field-locale-label"]');
      expect(labels.eq(0).text()).toMatch('(required)');
      expect(labels.eq(1).text()).not.toMatch('(required)');
    });

    it('shows locale name for multiple locales', function () {
      this.widget.field.required = true;
      const el = this.compile();
      const labels = el.find('[data-test-id="field-locale-label"]');
      expect(labels.length).toEqual(2);
      expect(labels.eq(0).text()).toMatch('Default');
      expect(labels.eq(1).text()).toMatch('English');
    });
  });

  describe('editing permissions', function () {
    it('shows message if user does not have editing permissions', function () {
      this.otDoc = this.$inject('mocks/entityEditor/Document').create();
      this.otDoc.permissions.canEditFieldLocale = function (_field, locale) {
        return locale === 'EN';
      };

      const el = this.compile();
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
      const hint = this.compile().find('[data-test-id=field-hint]');
      expect(hint.length).toBe(1);
      expect(hint.text()).toEqual('HELP TEXT');
    });

    it('shows custom widget settings help text', function () {
      this.widget.defaultHelpText = 'DEFAULT';
      this.widget.settings.helpText = 'HELP TEXT';
      const hint = this.compile().find('[data-test-id=field-hint]');
      expect(hint.length).toBe(1);
      expect(hint.text()).toEqual('HELP TEXT');
    });

    it('does not show hint if widget renders it', function () {
      this.widget.settings.helpText = 'HELP TEXT';
      this.widget.rendersHelpText = true;
      const hint = this.compile().find('[data-test-id=field-hint]');
      expect(hint.length).toBe(0);
    });
  });

  describe('visible locales', function () {
    it('only shows default locale when field is not localized', function () {
      this.setLocales([
        {code: 'en', default: true}, {code: 'de'}, {code: 'fr'}
      ]);
      this.widget.field.localized = false;
      const el = this.compile();
      expect(getDataLocaleAttr(el)).toEqual(['en']);
    });

    it('responds to changing the active locales', function () {
      this.setLocales([
        {code: 'en'},
        {code: 'de', active: false},
        {code: 'fr'}
      ]);
      const el = this.compile();
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

      const el = this.compile();
      expect(getDataLocaleAttr(el)).toEqual(['en']);

      this.validator.hasFieldLocaleError
        .withArgs('FID', 'de-internal')
        .returns(true);
      // we need to force an update unfortunately
      this.validator.errors$.set([]);
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
      const el = this.compile();
      expect(hasErrorStatus(el)).toBe(false);

      this.validator.errors$.set([
        {path: ['fields', 'FID', 'DEF-internal'], name: 'def-error'},
        {path: ['fields', 'FID', 'EN-internal'], name: 'en-error-1'},
        {path: ['fields', 'FID', 'EN-internal'], name: 'en-error-2'}
      ]);
      this.$apply();

      const defLocale = el.find('[data-locale=DEF]');
      expect(hasErrorStatus(defLocale, 'entry.schema.def-error')).toBe(true);

      const enLocale = el.find('[data-locale=EN]');
      expect(hasErrorStatus(enLocale, 'entry.schema.en-error-1')).toBe(true);
      expect(hasErrorStatus(enLocale, 'entry.schema.en-error-2')).toBe(true);
    });

    it('sets field’s invalid state if there are schema errors', function () {
      const el = this.compile();
      assertInvalidState(el.field, false);

      this.validator.hasFieldError
        .withArgs('FID')
        .returns(true);
      // we need to force an update unfortunately
      this.validator.errors$.set([]);
      this.$apply();
      assertInvalidState(el.field, true);

      this.validator.hasFieldError = sinon.stub().returns(false);
      this.validator.errors$.set([]);
      this.$apply();
      assertInvalidState(el.field, false);
    });

    it('sets field’s invalid state if a field control is invalid', function () {
      const el = this.compile();
      assertInvalidState(el.field, false);

      el.fieldController.setInvalid('DEF', true);
      el.fieldController.setInvalid('EN', true);
      this.$apply();
      assertInvalidState(el.field, true);

      el.fieldController.setInvalid('EN', false);
      this.$apply();
      assertInvalidState(el.field, true);

      el.fieldController.setInvalid('DEF', false);
      this.$apply();
      assertInvalidState(el.field, false);
    });

    it('shows link for duplicate errors', function () {
      const view = DOM.createView(this.compile().get(0));

      this.validator.errors$.set([{
        path: ['fields', 'FID', 'DEF-internal'],
        name: 'unique',
        conflicting: [{sys: { id: 'DUPLICATE' }}],
        message: ''
      }]);
      this.$apply();
      view.find('uniqueness-conflicts-list').assertHasText('TITLE DUPLICATE');
    });
  });

  describe('focus', function () {
    it('is set when widget activates this field', function () {
      const el = this.compile();

      this.focus.set('FID');
      this.$apply();
      assertAriaFlag(el.field, 'current', true);
    });

    it('is unset when other field activates', function () {
      const el = this.compile();

      this.focus.set('FID');
      this.$apply();
      assertAriaFlag(el.field, 'current', true);

      this.focus.set('other');
      this.$apply();
      assertAriaFlag(el.field, 'current', false);
    });

    it('is unset when widget deactivates this field', function () {
      const el = this.compile();

      this.focus.set('FID');
      this.$apply();
      assertAriaFlag(el.field, 'current', true);

      this.focus.unset('FID');
      this.$apply();
      assertAriaFlag(el.field, 'current', false);
    });
  });

  function hasErrorStatus (el, errorCode) {
    let selector = '[role="status"]';
    if (errorCode) {
      selector += '[data-error-code^="' + errorCode + '"]';
    }
    return el.find(selector).length > 0;
  }

  function assertInvalidState (el, isInvalid) {
    assertAriaFlag(el, 'invalid', isInvalid);
  }

  function assertAriaFlag (el, flag, value) {
    if (value === undefined) {
      value = true;
    }

    const attrValue = el.attr('aria-' + flag);
    const flagValue = !!(attrValue && attrValue !== 'false');

    if (flagValue !== value) {
      throw new Error('Expected element to have "aria-' + flag + '" set to ' + value);
    }
  }
});
