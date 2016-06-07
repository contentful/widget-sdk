'use strict';

describe('FieldLocaleController', function () {
  beforeEach(function () {
    module('contentful/test');
    var $rootScope = this.$inject('$rootScope');
    var $controller = this.$inject('$controller');
    this.init = function (scopeProps) {
      var defaultScopeProps = {
        field: {id: 'FID'},
        locale: {internal_code: 'LID'}
      };
      var scope = _.extend($rootScope.$new(), defaultScopeProps, scopeProps);
      scope.fieldLocale = $controller('FieldLocaleController', {$scope: scope});
      scope.validator = {};
      this.$apply();
      return scope;
    };
  });

  describe('#errors', function () {
    it('get filtered items from "validator.errors"', function () {
      var scope = this.init();

      var fieldLocaleErrors = [
        {path: ['fields', 'FID']},
        {path: ['fields', 'FID', 'LID']},
        {path: ['fields', 'FID', 'LID', 'X']}
      ];

      var otherErrors = [
        {path: ['fields', 'FID', 'LID-2']},
        {path: ['fields', 'FID-2', 'LID']},
        {path: ['fields', 'FID-2']}
      ];

      scope.validator.errors = fieldLocaleErrors.concat(otherErrors);
      this.$apply();
      expect(scope.fieldLocale.errors).toEqual(fieldLocaleErrors);
    });

    it('is set to "null" if no errors match', function () {
      var scope = this.init();
      scope.validator.errors = [{path: 'does not match'}];
      this.$apply();
      expect(scope.fieldLocale.errors).toEqual(null);
    });

    it('excludes field-level "required" error if a locale is optional', function () {
      var requiredError = {path: ['fields', 'FID'], name: 'required'};
      var scope = this.init();
      scope.locale.optional = true;
      scope.validator.errors = [requiredError];
      this.$apply();
      expect(scope.fieldLocale.errors).toEqual(null);
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
    it('watches "otPresence" with path', function () {
      var scope = this.init();
      dotty.put(
        scope,
        ['otPresence', 'fields', 'fields.FID.LID', 'users'],
        'USERS'
      );
      this.$apply();
      expect(scope.fieldLocale.collaborators).toEqual('USERS');
    });
  });

  describe('#setActive()', function () {

    beforeEach(function () {
      this.scope = this.init({
        docPresence: {focus: sinon.stub()},
        focus: {
          set: sinon.stub(),
          unset: sinon.stub()
        }
      });
    });

    it('calls "docPresence.focus()" if set to true', function () {
      this.scope.fieldLocale.setActive(true);
      var focus = this.scope.docPresence.focus;
      sinon.assert.calledWithExactly(focus, 'fields.FID.LID');
    });

    it('calls "scope.focus.set()" if set to true', function () {
      this.scope.fieldLocale.setActive(true);
      var setFocus = this.scope.focus.set;
      sinon.assert.calledWithExactly(setFocus, 'FID');
    });

    it('calls "scope.focus.unset()" if set to false', function () {
      this.scope.fieldLocale.setActive(false);
      var unsetFocus = this.scope.focus.unset;
      sinon.assert.calledWithExactly(unsetFocus, 'FID');
    });
  });

  describe('#access', function () {
    var withEditableDoc = {};
    dotty.put(withEditableDoc, 'otDoc.state.editable', true);
    var withNonEditableDoc = {};
    dotty.put(withNonEditableDoc, 'otDoc.state.editable', false);

    beforeEach(function () {
      this.hasEditingPermission = sinon.stub();
      var accessChecker = this.$inject('accessChecker');
      accessChecker.getFieldChecker = sinon.stub().returns({
        isEditable: this.hasEditingPermission
      });
    });

    it('is "disabled" and "disconnected" without connection and with permission', function () {
      this.hasEditingPermission.returns(true);
      var scope = this.init(withNonEditableDoc);
      expect(scope.fieldLocale.access).toEqual({
        disconnected: true,
        disabled: true
      });
    });

    it('is "disabled" and "editing_disabled" if a field is disabled', function () {
      this.hasEditingPermission.returns(true);
      var field = {field: {disabled: true}};
      var scope = this.init(_.extend(field, withEditableDoc));
      expect(scope.fieldLocale.access).toEqual({
        editing_disabled: true,
        disabled: true
      });
    });

    it('is "disabled" and "denied" without permissions and with connection', function () {
      this.hasEditingPermission.returns(false);
      var scope = this.init(withEditableDoc);
      expect(scope.fieldLocale.access).toEqual({
        denied: true,
        disabled: true
      });
    });

    it('is "disabled" and "denied" without permissions and connection', function () {
      this.hasEditingPermission.returns(false);
      var scope = this.init(withNonEditableDoc);
      expect(scope.fieldLocale.access).toEqual({
        denied: true,
        disabled: true
      });
    });

    it('is "editable" with permissions and connection', function () {
      this.hasEditingPermission.returns(true);
      var scope = this.init(withEditableDoc);
      expect(scope.fieldLocale.access).toEqual({
        editable: true
      });
    });
  });
});
