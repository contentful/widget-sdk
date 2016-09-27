'use strict';

describe('FieldLocaleController', function () {
  beforeEach(function () {
    module('contentful/test');
    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');
    const K = this.$inject('mocks/kefir');
    this.extractValues = K.extractValues;
    this.init = function (scopeProps) {
      this.otDoc = this.$inject('mocks/entityEditor/Document').create();
      const defaultScopeProps = {
        field: {id: 'FID'},
        locale: {internal_code: 'LID'},
        otDoc: this.otDoc
      };
      const scope = _.merge($rootScope.$new(), defaultScopeProps, scopeProps);
      scope.validator = {
        errors$: K.createMockProperty([])
      };
      scope.fieldLocale = $controller('FieldLocaleController', {$scope: scope});
      this.$apply();
      return scope;
    };
  });

  describe('#errors$ and #errors', function () {
    it('get filtered items from "validator.errors"', function () {
      const scope = this.init();

      const fieldLocaleErrors = [
        {path: ['fields', 'FID']},
        {path: ['fields', 'FID', 'LID']},
        {path: ['fields', 'FID', 'LID', 'X']}
      ];

      const otherErrors = [
        {path: ['fields', 'FID', 'LID-2']},
        {path: ['fields', 'FID-2', 'LID']},
        {path: ['fields', 'FID-2']},
        {path: null}
      ];

      const errorsStream = this.extractValues(scope.fieldLocale.errors$);
      scope.validator.errors$.set(fieldLocaleErrors.concat(otherErrors));
      this.$apply();
      expect(scope.fieldLocale.errors).toEqual(fieldLocaleErrors);
      expect(errorsStream[0]).toEqual(fieldLocaleErrors);
    });

    it('is set to "null" if no errors match', function () {
      const scope = this.init();
      scope.validator.errors$.set([{path: 'does not match'}]);
      this.$apply();
      const errorsStream = this.extractValues(scope.fieldLocale.errors$);
      expect(scope.fieldLocale.errors).toEqual(null);
      expect(errorsStream[0]).toEqual(null);
    });

    it('excludes field-level "required" error if a locale is optional', function () {
      const errors = [
        {path: ['fields', 'FID'], name: 'required'},
        {path: ['fields', 'FID'], name: 'other'}
      ];
      const scope = this.init();
      scope.locale.optional = true;
      const errorsStream = this.extractValues(scope.fieldLocale.errors$);
      scope.validator.errors$.set(errors);
      this.$apply();
      expect(scope.fieldLocale.errors).toEqual([errors[1]]);
      expect(errorsStream[0]).toEqual([errors[1]]);
    });
  });

  describe('#isRequired', function () {
    describe('for entries', function () {
      beforeEach(function () {
        this.isRequired = function (required, optional) {
          return this.init({
            entry: {},
            field: {required: required},
            locale: {optional: optional}
          }).fieldLocale.isRequired;
        };
      });

      it('is required when field is required and locale is not optional', function () {
        expect(this.isRequired(true, false)).toBe(true);
      });

      it('is not required when field is not required', function () {
        expect(this.isRequired(false, false)).toBe(false);
      });

      it('is not required when field is required but locale is optional', function () {
        expect(this.isRequired(true, true)).toBe(false);
      });
    });

    describe('for assets', function () {
      beforeEach(function () {
        this.isRequired = function (required, def) {
          return this.init({
            asset: {},
            field: {required: required},
            locale: {default: def}
          }).fieldLocale.isRequired;
        };
      });

      it('is required for required fields for the default locale', function () {
        expect(this.isRequired(true, true)).toBe(true);
      });

      it('is not required for required fields for non-default locales', function () {
        expect(this.isRequired(true, false)).toBe(false);
      });

      it('is not required for non-required fields in the default locale', function () {
        expect(this.isRequired(false, true)).toBe(false);
      });
    });
  });

  describe('#collaborators', function () {
    it('watches "docPresence" with path', function () {
      const scope = this.init();
      this.otDoc.collaboratorsFor().set(['USER']);
      this.$apply();
      expect(scope.fieldLocale.collaborators).toEqual(['USER']);
    });
  });

  describe('#setActive()', function () {

    beforeEach(function () {
      this.scope = this.init({
        focus: {
          set: sinon.stub(),
          unset: sinon.stub()
        }
      });
    });

    it('calls "otDoc.notifyFocus()" if set to true', function () {
      this.scope.fieldLocale.setActive(true);
      const focus = this.otDoc.notifyFocus;
      sinon.assert.calledWithExactly(focus, 'FID', 'LID');
    });

    it('calls "scope.focus.set()" if set to true', function () {
      this.scope.fieldLocale.setActive(true);
      const setFocus = this.scope.focus.set;
      sinon.assert.calledWithExactly(setFocus, 'FID');
    });

    it('calls "scope.focus.unset()" if set to false', function () {
      this.scope.fieldLocale.setActive(false);
      const unsetFocus = this.scope.focus.unset;
      sinon.assert.calledWithExactly(unsetFocus, 'FID');
    });
  });

  describe('#access', function () {
    const withEditableDoc = {};
    dotty.put(withEditableDoc, 'otDoc.state.editable', true);
    const withNonEditableDoc = {};
    dotty.put(withNonEditableDoc, 'otDoc.state.editable', false);

    beforeEach(function () {
      const policyAccessChecker = this.$inject('accessChecker/policy');
      policyAccessChecker.canEditFieldLocale = this.hasEditingPermission = sinon.stub();
    });

    it('is "disabled" and "disconnected" without connection and with permission', function () {
      this.hasEditingPermission.returns(true);
      const scope = this.init(withNonEditableDoc);
      expect(scope.fieldLocale.access).toEqual({
        disconnected: true,
        disabled: true
      });
    });

    it('is "disabled" and "editing_disabled" if a field is disabled', function () {
      this.hasEditingPermission.returns(true);
      const field = {field: {disabled: true}};
      const scope = this.init(_.extend(field, withEditableDoc));
      expect(scope.fieldLocale.access).toEqual({
        editing_disabled: true,
        disabled: true
      });
    });

    it('is "disabled" and "denied" without permissions and with connection', function () {
      this.hasEditingPermission.returns(false);
      const scope = this.init(withEditableDoc);
      expect(scope.fieldLocale.access).toEqual({
        denied: true,
        disabled: true
      });
    });

    it('is "disabled" and "denied" without permissions and connection', function () {
      this.hasEditingPermission.returns(false);
      const scope = this.init(withNonEditableDoc);
      expect(scope.fieldLocale.access).toEqual({
        denied: true,
        disabled: true
      });
    });

    it('is "editable" with permissions and connection', function () {
      this.hasEditingPermission.returns(true);
      const scope = this.init(withEditableDoc);
      expect(scope.fieldLocale.access).toEqual({
        editable: true
      });
    });
  });
});
