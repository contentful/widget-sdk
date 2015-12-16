'use strict';

describe('Policy Access Checker', function () {

  var pac;

  beforeEach(function () {
    module('contentful/test');
    pac = this.$inject('accessChecker/policy');
  });

  var roles = {
    empty: {policies: []},
    allowAllEntry: {policies:[{
      effect: 'allow', actions: 'all',
      constraint:{and:[{equals:[{doc: 'sys.type'}, 'Entry']}]}
    }]},
    allowReadEntry: {policies:[{
      effect: 'allow', actions: ['read'],
      constraint:{and:[{equals:[{doc: 'sys.type'}, 'Entry']}]}
    }]},
    allowReadAndEditOfEntry: function (ctId) {
      return {policies: [{
        effect: 'allow', actions: ['read'],
        constraint: {and: [{equals:[{doc: 'sys.type'}, 'Entry']}]}
      }, {
        effect: 'allow', actions: ['update'],
        constraint: {and: [
          {equals: [{doc: 'sys.type'}, 'Entry']},
          {paths:  [{doc: 'fields.%.%'}]},
          {equals: [{doc: 'sys.contentType.sys.id'}, ctId]}
        ]}
      }]};
    },
    allowAllAsset: {policies:[{
      effect: 'allow', actions: 'all',
      constraint:{and:[{equals:[{doc: 'sys.type'}, 'Asset']}]}
    }]},
    allowReadAsset: {policies:[{
      effect: 'allow', actions: ['read'],
      constraint:{and:[{equals:[{doc: 'sys.type'}, 'Asset']}]}
    }]},
    allowReadAndEditAsset: {policies: [{
      effect: 'allow', actions: ['read'],
      constraint: {and: [{equals:[{doc: 'sys.type'}, 'Asset']}]}
    }, {
      effect: 'allow', actions: ['update'],
      constraint: {and: [{equals: [{doc: 'sys.type'}, 'Asset']}]}
    }]}
  };

  describe('#canAccessEntries', function () {
    it('returns false if there are no allow policies', function () {
      pac.setRole(roles.empty);
      expect(pac.canAccessEntries()).toBe(false);
    });

    it('returns true if there is at least one allow policy', function () {
      pac.setRole(roles.allowAllEntry);
      expect(pac.canAccessEntries()).toBe(true);
    });
  });

  describe('#canAccessAssets', function () {
    it('returns false if there are no allow policies', function () {
      pac.setRole(roles.empty);
      expect(pac.canAccessAssets()).toBe(false);
    });

    it('returns true if there is at least one allow policy', function () {
      pac.setRole(roles.allowAllAsset);
      expect(pac.canAccessAssets()).toBe(true);
    });
  });

  describe('#canUpdateEntriesOfType', function () {
    it('returns false if there are no allow policies', function () {
      pac.setRole(roles.empty);
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(false);
    });

    it('returns false if there is only read policy', function () {
      pac.setRole(roles.allowReadEntry);
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(false);
    });

    it('returns false if there is edit policy for another CT', function () {
      pac.setRole(roles.allowReadAndEditOfEntry('otherctid'));
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(false);
    });

    it('returns true when there is allow all policy', function () {
      pac.setRole(roles.allowAllEntry);
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(true);
    });

    it('returns true when there is edit policy for provided CT', function () {
      pac.setRole(roles.allowReadAndEditOfEntry('ctid'));
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(true);
    });
  });

  describe('#canUpdateAssets', function () {
    it('returns false if there are no allow policies', function () {
      pac.setRole(roles.empty);
      expect(pac.canUpdateAssets()).toBe(false);
    });

    it('returns false if there is only read policy', function () {
      pac.setRole(roles.allowReadAsset);
      expect(pac.canUpdateAssets()).toBe(false);
    });

    it('returns true if there is allow all policy', function () {
      pac.setRole(roles.allowAllAsset);
      expect(pac.canUpdateAssets()).toBe(true);
    });

    it('returns true if there is allow edit policy', function () {
      pac.setRole(roles.allowReadAndEditAsset);
      expect(pac.canUpdateAssets()).toBe(true);
    });
  });

  describe('#getFieldChecker', function () {
    beforeEach(function () {
      pac.setRole(roles.empty);
    });

    function pathPolicy(path, effect) {
      return {policies: [{
        effect: (effect || 'allow'),
        actions: ['update'],
        constraint: {and: [
          {equals: [{doc: 'sys.type'}, 'Entry']},
          {paths:  [{doc: path}]},
          {equals: [{doc: 'sys.contentType.sys.id'}, 'ctid']}
        ]}
      }]};
    }

    function assetPathPolicy(path, effect) {
      return {policies: [{
        effect: (effect || 'allow'),
        actions: ['update'],
        constraint: {and: [
          {equals: [{doc: 'sys.type'}, 'Asset']},
          {paths:  [{doc: path}]}
        ]}
      }]};
    }

    function test(field, locale, expectation, fac) {
      fac = fac || pac.getFieldChecker({
        type: 'Entry',
        contentTypeId: 'ctid',
        baseCanUpdateFn: _.constant(false)
      });

      expect(fac.isEditable(field, locale)).toBe(expectation);
      expect(fac.isDisabled(field, locale)).toBe(!expectation);
    }

    it('isEditable returns true if baseCanUpdateFn returns true', function () {
      var fac = pac.getFieldChecker({baseCanUpdateFn: _.constant(true)});
      test({}, {}, true, fac);
    });

    it('isEditable returns false if predicate returns false', function () {
      var fac = pac.getFieldChecker({baseCanUpdateFn: _.constant(true), predicate: _.constant(false)});
      test({}, {}, false, fac);
      expect(fac.isEditable({}, {})).toBe(false);
    });

    it('isEditable returns false if policy states: field - other than given, locale - any', function () {
      pac.setRole(pathPolicy('fields.other.%'));
      test({apiName: 'test'}, {}, false);
    });

    it('isEditable returns false if policy states: field - any, locale - other than given', function () {
      pac.setRole(pathPolicy('fields.%.en'));
      test({apiName: 'test'}, {internal_code: 'pl'}, false);
    });

    it('isEditable returns false if policy states: field - other than given, locale - other than given', function () {
      pac.setRole(pathPolicy('fields.other.en'));
      test({apiName: 'test'}, {internal_code: 'pl'}, false);
    });

    it('isEditable returns true if policy states: field - given, locale - any', function () {
      pac.setRole(pathPolicy('fields.test.%'));
      test({apiName: 'test'}, {}, true);
    });

    it('isEditable returns true if policy states: field - any, locale - given', function () {
      pac.setRole(pathPolicy('fields.%.en'));
      test({apiName: 'somefield'}, {internal_code: 'en'}, true);
    });

    it('isEditable returns true if policy states: field - give, locale - given', function () {
      pac.setRole(pathPolicy('fields.test.pl'));
      test({apiName: 'test'}, {internal_code: 'pl'}, true);
    });

    it('isEditable returns false if there is overriding policy', function () {
      var p1 = pathPolicy('fields.test.pl');
      var p2 = pathPolicy('fields.test.pl', 'deny');
      pac.setRole({policies: _.union(p1.policies, p2.policies)});
      test({apiName: 'test'}, {internal_code: 'pl'}, false);
    });

    it('isEditable returns false if there is partially overriding policy', function () {
      var p1 = pathPolicy('fields.test.pl');
      var p2 = pathPolicy('fields.%.pl', 'deny');
      pac.setRole({policies: _.union(p1.policies, p2.policies)});
      test({apiName: 'test'}, {internal_code: 'pl'}, false);
    });

    it('isEditable uses legacy field ID property if apiName is not available', function () {
      pac.setRole(pathPolicy('fields.test.%'));
      test({id: 'test'}, {internal_code: 'pl'}, true);
    });

    it('isEditable returns false if CT does not match', function () {
      var fac = pac.getFieldChecker({baseCanUpdateFn: _.constant(false), type: 'Entry', contentTypeId: 'x'});
      pac.setRole(pathPolicy('fields.test.pl'));
      test({apiName: 'test'}, {internal_code: 'pl'}, false, fac);
    });

    it('isEditable returns false for asset field w/o allow policies', function () {
      var fac = pac.getFieldChecker({baseCanUpdateFn: _.constant(false), type: 'Asset'});
      test({}, {}, false, fac);
    });

    it('isEditable returns false for asset with policy allowing editing other locale', function () {
      var fac = pac.getFieldChecker({baseCanUpdateFn: _.constant(false), type: 'Asset'});
      pac.setRole(assetPathPolicy('fields.%.en'));
      test({}, {internal_code: 'pl'}, false, fac);
    });

    it('isEditable returns true for asset with allowing policy', function () {
      var fac = pac.getFieldChecker({baseCanUpdateFn: _.constant(false), type: 'Asset'});
      pac.setRole(assetPathPolicy('fields.%.en'));
      test({}, {internal_code: 'en'}, true, fac);
    });
  });
});
