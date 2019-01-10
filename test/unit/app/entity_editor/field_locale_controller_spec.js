import * as K from 'test/helpers/mocks/kefir';
import * as sinon from 'test/helpers/sinon';

describe('FieldLocaleController', () => {
  beforeEach(function() {
    module('contentful/test');
    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');

    this.createDocument = this.$inject('mocks/entityEditor/Document').create;
    this.sandbox = sinon.sandbox.create();
    this.init = function(patchScope) {
      this.otDoc = this.otDoc || this.createDocument();
      const scope = Object.assign($rootScope.$new(), {
        widget: {
          field: { id: 'FID' }
        },
        locale: { internal_code: 'LID' },
        otDoc: this.otDoc,
        editorContext: this.$inject('mocks/entityEditor/Context').create()
      });
      if (patchScope) {
        patchScope(scope);
      }
      scope.fieldLocale = $controller('FieldLocaleController', { $scope: scope, $attrs: {} });
      this.$apply();
      return scope;
    };
  });

  afterEach(function() {
    this.sandbox.restore();
  });

  describe('#errors$ and #errors', () => {
    it('get filtered items from "validator.errors"', function() {
      const scope = this.init();

      const fieldLocaleErrors = [
        { path: ['fields', 'FID'] },
        { path: ['fields', 'FID', 'LID'] },
        { path: ['fields', 'FID', 'LID', 'X'] }
      ];

      const otherErrors = [
        { path: ['fields', 'FID', 'LID-2'] },
        { path: ['fields', 'FID-2', 'LID'] },
        { path: ['fields', 'FID-2'] },
        { path: null }
      ];

      const errorsStream = K.extractValues(scope.fieldLocale.errors$);
      scope.editorContext.validator.errors$.set(fieldLocaleErrors.concat(otherErrors));
      this.$apply();
      expect(scope.fieldLocale.errors).toEqual(fieldLocaleErrors);
      expect(errorsStream[0]).toEqual(fieldLocaleErrors);
    });

    it('is set to "null" if no errors match', function() {
      const scope = this.init();
      scope.editorContext.validator.errors$.set([{ path: 'does not match' }]);
      this.$apply();
      const errorsStream = K.extractValues(scope.fieldLocale.errors$);
      expect(scope.fieldLocale.errors).toEqual(null);
      expect(errorsStream[0]).toEqual(null);
    });

    it('excludes field-level "required" error if a locale is optional', function() {
      const errors = [
        { path: ['fields', 'FID'], name: 'required' },
        { path: ['fields', 'FID'], name: 'other' }
      ];
      const scope = this.init();
      scope.locale.optional = true;
      const errorsStream = K.extractValues(scope.fieldLocale.errors$);
      scope.editorContext.validator.errors$.set(errors);
      this.$apply();
      expect(scope.fieldLocale.errors).toEqual([errors[1]]);
      expect(errorsStream[0]).toEqual([errors[1]]);
    });
  });

  describe('#isRequired', () => {
    describe('for entries', () => {
      beforeEach(function() {
        this.isRequired = function(required, optional) {
          return this.init(scope => {
            scope.widget.field.required = required;
            scope.locale.optional = optional;
          }).fieldLocale.isRequired;
        };
      });

      it('is required when field is required and locale is not optional', function() {
        expect(this.isRequired(true, false)).toBe(true);
      });

      it('is not required when field is not required', function() {
        expect(this.isRequired(false, false)).toBe(false);
      });

      it('is not required when field is required but locale is optional', function() {
        expect(this.isRequired(true, true)).toBe(false);
      });
    });

    describe('for assets', () => {
      beforeEach(function() {
        this.isRequired = function(required, def) {
          return this.init(scope => {
            scope.editorContext.entityInfo.type = 'Asset';
            scope.widget.field.required = required;
            scope.locale.default = def;
          }).fieldLocale.isRequired;
        };
      });

      it('is required for required fields for the default locale', function() {
        expect(this.isRequired(true, true)).toBe(true);
      });

      it('is not required for required fields for non-default locales', function() {
        expect(this.isRequired(true, false)).toBe(false);
      });

      it('is not required for non-required fields in the default locale', function() {
        expect(this.isRequired(false, true)).toBe(false);
      });
    });
  });

  describe('#collaborators', () => {
    it('watches "docPresence" with path', function() {
      const scope = this.init();
      this.otDoc.collaboratorsFor().set(['USER']);
      this.$apply();
      expect(scope.fieldLocale.collaborators).toEqual(['USER']);
    });
  });

  describe('#setActive()', () => {
    beforeEach(function() {
      this.scope = this.init();
    });

    it('calls "otDoc.notifyFocus()" if set to true', function() {
      this.scope.fieldLocale.setActive(true);
      const focus = this.otDoc.notifyFocus;
      sinon.assert.calledWithExactly(focus, 'FID', 'LID');
    });

    it('sets the editor context field focus', function() {
      K.assertCurrentValue(this.scope.editorContext.focus.field$, null);
      this.scope.fieldLocale.setActive(true);
      K.assertCurrentValue(this.scope.editorContext.focus.field$, 'FID');
    });

    it('does not set focus on a disabled field', function() {
      this.otDoc.permissions.canEditFieldLocale.returns(false);
      const scope = this.init();
      this.$apply();
      scope.fieldLocale.setActive(true);
      K.assertCurrentValue(scope.editorContext.focus.field$, null);
    });

    it('unsets the editor context field focus', function() {
      this.scope.fieldLocale.setActive(true);
      K.assertCurrentValue(this.scope.editorContext.focus.field$, 'FID');
      this.scope.fieldLocale.setActive(false);
      K.assertCurrentValue(this.scope.editorContext.focus.field$, null);
    });
  });

  describe('#access', () => {
    beforeEach(function() {
      this.otDoc = this.createDocument();
      this.hasEditingPermission = this.otDoc.permissions.canEditFieldLocale;
    });

    it('is "disabled" and "disconnected" without connection and with permission', function() {
      this.hasEditingPermission.returns(true);
      const scope = this.init();
      this.otDoc.state.isConnected$.set(false);
      this.$apply();
      expect(scope.fieldLocale.access).toEqual({
        disconnected: true,
        disabled: true
      });
    });

    it('is "disconnected" and "disabled" when is connected with an erroneous document status', function() {
      this.otDoc.status$ = K.createMockProperty('internal-server-error');
      this.otDoc.state.isConnected$.set(true);
      const scope = this.init();
      this.$apply();
      expect(scope.fieldLocale.access).toEqual({ disconnected: true, disabled: true });
    });

    it('is "disabled" and "editing_disabled" if a field is disabled', function() {
      this.hasEditingPermission.returns(true);
      const scope = this.init(scope => {
        scope.widget.field.disabled = true;
      });
      this.$apply();
      expect(scope.fieldLocale.access).toEqual({
        editing_disabled: true,
        disabled: true
      });
    });

    it('is "disabled" and "occupied" for `RichText` field with collaborators', function() {
      this.otDoc.collaboratorsFor.returns(K.createMockProperty([{}]));
      const scope = this.init(scope => {
        scope.widget.field.type = 'RichText';
      });
      this.$apply();
      expect(scope.fieldLocale.access).toEqual({
        occupied: true,
        disabled: true
      });
    });

    it('is "disabled" and "denied" without permissions and with connection', function() {
      this.hasEditingPermission.returns(false);
      const scope = this.init();
      this.$apply();
      expect(scope.fieldLocale.access).toEqual({
        denied: true,
        disabled: true
      });
    });

    it('is "disabled" and "denied" without permissions and connection', function() {
      this.hasEditingPermission.returns(false);
      const scope = this.init();
      this.otDoc.state.isConnected$.set(false);
      this.$apply();
      expect(scope.fieldLocale.access).toEqual({
        denied: true,
        disabled: true
      });
    });

    it('is "editable" with permissions and connection', function() {
      this.hasEditingPermission.returns(true);
      const scope = this.init();
      this.$apply();
      expect(scope.fieldLocale.access).toEqual({
        editable: true
      });
    });
  });

  it('revalidates the field locale whenever the user has stopped editing for 800ms', function() {
    const clock = this.sandbox.useFakeTimers();
    const scope = this.init();
    const validator = scope.editorContext.validator;
    this.otDoc.localFieldChanges$.emit(['FID', 'LID']);
    sinon.assert.notCalled(validator.validateFieldLocale);
    clock.tick(800);
    sinon.assert.calledOnceWith(validator.validateFieldLocale, 'FID', 'LID');
  });
});
