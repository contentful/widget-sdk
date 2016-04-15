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
      this.$apply();
      return scope;
    };
  });

  describe('#errors', function () {
    it('get filtered items from "validationResult.errors"', function () {
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

      scope.validationResult = {errors: fieldLocaleErrors.concat(otherErrors)};
      this.$apply();
      expect(scope.fieldLocale.errors).toEqual(fieldLocaleErrors);
    });

    it('is set to "null" if no errors match', function () {
      var scope = this.init();
      scope.validationResult = {errors: [{path: 'does not match'}]};
      this.$apply();
      expect(scope.fieldLocale.errors).toEqual(null);
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

  describe('#announcePresence()', function () {
    it('delegates to "docPresence.focus()"', function () {
      var focus = sinon.stub();
      var scope = this.init({
        docPresence: {focus: focus}
      });
      scope.fieldLocale.announcePresence();
      sinon.assert.calledWithExactly(focus, 'fields.FID.LID');
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
