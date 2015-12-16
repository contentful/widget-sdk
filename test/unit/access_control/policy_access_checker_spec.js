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
});
