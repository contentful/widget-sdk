'use strict';

describe('Policy Access Checker', () => {
  let pac;

  beforeEach(function () {
    module('contentful/test');
    pac = this.$inject('access_control/AccessChecker/PolicyChecker');
  });

  const roles = {
    empty: {policies: []},
    allowAllEntry: {policies: [{
      effect: 'allow', actions: 'all',
      constraint: {and: [{equals: [{doc: 'sys.type'}, 'Entry']}]}
    }]},
    allowReadEntry: {policies: [{
      effect: 'allow', actions: ['read'],
      constraint: {and: [{equals: [{doc: 'sys.type'}, 'Entry']}]}
    }]},
    allowReadAndEditOfEntry: function (ctId) {
      return {policies: [{
        effect: 'allow', actions: ['read'],
        constraint: {and: [{equals: [{doc: 'sys.type'}, 'Entry']}]}
      }, {
        effect: 'allow', actions: ['update'],
        constraint: {and: [
          {equals: [{doc: 'sys.type'}, 'Entry']},
          {equals: [{doc: 'sys.contentType.sys.id'}, ctId]}
        ]}
      }]};
    },
    denyEditOfEntry: function (ctId) {
      return {policies: [{
        effect: 'deny', actions: ['update'],
        constraint: {and: [
          {equals: [{doc: 'sys.type'}, 'Entry']},
          {equals: [{doc: 'sys.contentType.sys.id'}, ctId]}
        ]}
      }]};
    },
    allowAllAsset: {policies: [{
      effect: 'allow', actions: 'all',
      constraint: {and: [{equals: [{doc: 'sys.type'}, 'Asset']}]}
    }]},
    allowReadAsset: {policies: [{
      effect: 'allow', actions: ['read'],
      constraint: {and: [{equals: [{doc: 'sys.type'}, 'Asset']}]}
    }]},
    allowReadAndEditAsset: {policies: [{
      effect: 'allow', actions: ['read'],
      constraint: {and: [{equals: [{doc: 'sys.type'}, 'Asset']}]}
    }, {
      effect: 'allow', actions: ['update'],
      constraint: {and: [{equals: [{doc: 'sys.type'}, 'Asset']}]}
    }]},
    denyEditAsset: {policies: [{
      effect: 'deny', actions: ['update'],
      constraint: {and: [{equals: [{doc: 'sys.type'}, 'Asset']}]}
    }]}
  };

  function setRole (role, isAdmin) {
    pac.setMembership({
      admin: isAdmin,
      roles: [role]
    }, {
      environment: {sys: { isMaster: true }}
    });
  }

  function clone (x) {
    return _.cloneDeep(x, true);
  }

  describe('#canAccessEntries', () => {
    it('returns false if there are no allow policies', () => {
      setRole(roles.empty);
      expect(pac.canAccessEntries()).toBe(false);
    });

    it('returns true if there is at least one allow policy', () => {
      setRole(roles.allowAllEntry);
      expect(pac.canAccessEntries()).toBe(true);
    });
  });

  describe('#canAccessAssets', () => {
    it('returns false if there are no allow policies', () => {
      setRole(roles.empty);
      expect(pac.canAccessAssets()).toBe(false);
    });

    it('returns true if there is at least one allow policy', () => {
      setRole(roles.allowAllAsset);
      expect(pac.canAccessAssets()).toBe(true);
    });
  });

  describe('#canUpdateEntriesOfType', () => {
    it('returns false if there are no allow policies', () => {
      setRole(roles.empty);
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(false);
    });

    it('returns false if there is only read policy', () => {
      setRole(roles.allowReadEntry);
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(false);
    });

    it('returns false if there is edit policy for another CT', () => {
      setRole(roles.allowReadAndEditOfEntry('otherctid'));
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(false);
    });

    it('returns true when there is allow all policy', () => {
      setRole(roles.allowAllEntry);
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(true);
    });

    it('returns true when there is edit policy for provided CT', () => {
      setRole(roles.allowReadAndEditOfEntry('ctid'));
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(true);
    });

    it('returns false when has only denying rule for edit', () => {
      const allow = roles.allowAllEntry;
      const deny = roles.denyEditOfEntry('ctid');
      setRole({ policies: allow.policies.concat(deny.policies) });
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(false);
    });

    it('returns false when there is both general allowing and denying rules', () => {
      const allow = roles.allowReadAndEditOfEntry('ctid');
      const deny = roles.denyEditOfEntry('ctid');
      setRole({ policies: allow.policies.concat(deny.policies) });
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(false);
    });

    it('returns true when then there is allowing policy and denying for only a single field', () => {
      const allow = roles.allowReadAndEditOfEntry('ctid');
      const deny = roles.denyEditOfEntry('ctid');
      deny.policies[0].constraint.and.push({paths: [{doc: 'fields.test.%'}]});
      setRole({ policies: allow.policies.concat(deny.policies) });
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(true);
    });

    it('returns true when there is allowing policy for a field and denying for another one', () => {
      const allow = roles.allowReadAndEditOfEntry('ctid');
      allow.policies[1].constraint.and.push({paths: [{doc: 'fields.test.%'}]});
      const deny = roles.denyEditOfEntry('ctid');
      deny.policies[0].constraint.and.push({paths: [{doc: 'fields.test2.%'}]});
      setRole({policies: allow.policies.concat(deny.policies)});
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(true);
    });

    it('returns true when there is allowing policy for a single locale', () => {
      const allow = roles.allowReadAndEditOfEntry('ctid');
      allow.policies[1].constraint.and.push({paths: [{doc: 'fields.%.en-US'}]});
      setRole(allow);
      expect(pac.canUpdateEntriesOfType('ctid')).toBe(true);
    });
  });

  describe('#canUpdateOwnEntries', () => {
    const userCurrent = {equals: [{doc: 'sys.createdBy.sys.id'}, 'User.current()']};

    it('returns false when there is no user-scoped policy', () => {
      setRole(roles.allowReadAndEditOfEntry('ctid'));
      expect(pac.canUpdateOwnEntries()).toBe(false);
    });

    it('returns true when there is allowing user-scoped policy', () => {
      const allow = roles.allowReadAndEditOfEntry('ctid');
      allow.policies[1].constraint.and.push(userCurrent);
      setRole(allow);
      expect(pac.canUpdateOwnEntries()).toBe(true);
    });

    it('returns true when there is user-scoped allowing path rule', () => {
      const allow = roles.allowReadAndEditOfEntry('ctid');
      allow.policies[1].constraint.and.push(userCurrent);
      allow.policies[1].constraint.and.push({paths: [{doc: 'fields.test.%'}]});
      setRole(allow);
      expect(pac.canUpdateOwnEntries()).toBe(true);
    });

    it('returns false when there is general denying user-scoped rule', () => {
      const allow = roles.allowReadAndEditOfEntry('ctid');
      allow.policies[1].constraint.and.push(userCurrent);
      const deny = roles.denyEditOfEntry('ctid');
      deny.policies[0].constraint.and.push(userCurrent);
      setRole({ policies: allow.policies.concat(deny.policies) });
      expect(pac.canUpdateOwnEntries()).toBe(false);
    });

    it('returns true when there is denying user-scoped path rule', () => {
      const allow = roles.allowReadAndEditOfEntry('ctid');
      allow.policies[1].constraint.and.push(userCurrent);
      const deny = roles.denyEditOfEntry('ctid');
      deny.policies[0].constraint.and.push(userCurrent);
      deny.policies[0].constraint.and.push({paths: [{doc: 'fields.test.%'}]});
      setRole({ policies: allow.policies.concat(deny.policies) });
      expect(pac.canUpdateOwnEntries()).toBe(true);
    });
  });

  describe('#canUpdateAssets', () => {
    it('returns false if there are no allow policies', () => {
      setRole(roles.empty);
      expect(pac.canUpdateAssets()).toBe(false);
    });

    it('returns false if there is only read policy', () => {
      setRole(roles.allowReadAsset);
      expect(pac.canUpdateAssets()).toBe(false);
    });

    it('returns true if there is allow all policy', () => {
      setRole(roles.allowAllAsset);
      expect(pac.canUpdateAssets()).toBe(true);
    });

    it('returns true if there is allow edit policy', () => {
      setRole(roles.allowReadAndEditAsset);
      expect(pac.canUpdateAssets()).toBe(true);
    });

    it('returns false when there is a general deny rule', () => {
      setRole(roles.denyEditAsset);
      expect(pac.canUpdateAssets()).toBe(false);
    });

    it('returns false when there is both allowing and denying rule', () => {
      const allow = roles.allowReadAndEditAsset;
      const deny = roles.denyEditAsset;
      setRole({policies: allow.policies.concat(deny.policies)});
      expect(pac.canUpdateAssets()).toBe(false);
    });

    it('returns true when there is denying rule for a single locale', () => {
      const allow = roles.allowReadAndEditAsset;
      const deny = clone(roles.denyEditAsset);
      deny.policies[0].constraint.and.push({paths: [{doc: 'fields.%.en-US'}]});
      setRole({policies: allow.policies.concat(deny.policies)});
      expect(pac.canUpdateAssets()).toBe(true);
    });

    it('returns true when there are allowing and denying rules for different locales', () => {
      const allow = clone(roles.allowReadAndEditAsset);
      allow.policies[1].constraint.and.push({paths: [{doc: 'fields.%.pl-PL'}]});
      const deny = clone(roles.denyEditAsset);
      deny.policies[0].constraint.and.push({paths: [{doc: 'fields.%.en-US'}]});
      setRole({policies: allow.policies.concat(deny.policies)});
      expect(pac.canUpdateAssets()).toBe(true);
    });
  });

  describe('#canUpdateOwnAssets', () => {
    const userCurrent = {equals: [{doc: 'sys.createdBy.sys.id'}, 'User.current()']};

    it('returns false when there is no user-scoped policy', () => {
      setRole(roles.allowReadAndEditAsset);
      expect(pac.canUpdateOwnAssets()).toBe(false);
    });

    it('returns true when there is allowing user-scoped policy', () => {
      const allow = clone(roles.allowReadAndEditAsset);
      allow.policies[1].constraint.and.push(userCurrent);
      setRole(allow);
      expect(pac.canUpdateOwnAssets()).toBe(true);
    });

    it('returns true when there is user-scoped allowing locale rule', () => {
      const allow = clone(roles.allowReadAndEditAsset);
      allow.policies[1].constraint.and.push(userCurrent);
      allow.policies[1].constraint.and.push({paths: [{doc: 'fields.%.en-US'}]});
      setRole(allow);
      expect(pac.canUpdateOwnAssets()).toBe(true);
    });

    it('returns false when there is general denying user-scoped rule', () => {
      const allow = clone(roles.allowReadAndEditAsset);
      allow.policies[1].constraint.and.push(userCurrent);
      const deny = clone(roles.denyEditAsset);
      deny.policies[0].constraint.and.push(userCurrent);
      setRole({ policies: allow.policies.concat(deny.policies) });
      expect(pac.canUpdateOwnAssets()).toBe(false);
    });

    it('returns true when there is denying user-scoped locale rule', () => {
      const allow = clone(roles.allowReadAndEditAsset);
      allow.policies[1].constraint.and.push(userCurrent);
      const deny = clone(roles.denyEditAsset);
      deny.policies[0].constraint.and.push(userCurrent);
      deny.policies[0].constraint.and.push({paths: [{doc: 'fields.%.en-US'}]});
      setRole({ policies: allow.policies.concat(deny.policies) });
      expect(pac.canUpdateOwnAssets()).toBe(true);
    });
  });

  describe('#canEditFieldLocale', () => {
    beforeEach(() => {
      setRole(roles.empty);
    });

    function pathPolicy (path, effect) {
      return {policies: [{
        effect: (effect || 'allow'),
        actions: ['update'],
        constraint: {and: [
          {equals: [{doc: 'sys.type'}, 'Entry']},
          {paths: [{doc: path}]},
          {equals: [{doc: 'sys.contentType.sys.id'}, 'ctid']}
        ]}
      }]};
    }

    function allowIdPolicy (entityId) {
      return {policies: [{
        effect: 'allow',
        actions: ['all'],
        constraint: {and: [
          {equals: [{doc: 'sys.type'}, 'Entry']},
          {equals: [{doc: 'sys.id'}, entityId]}
        ]}
      }]};
    }

    function denyIdPolicy (entityId) {
      return {policies: [{
        effect: 'allow',
        actions: ['all'],
        constraint: {and: [
          {equals: [{doc: 'sys.type'}, 'Entry']}
        ]}
      }, {
        effect: 'deny',
        actions: ['all'],
        constraint: {and: [
          {equals: [{doc: 'sys.type'}, 'Entry']},
          {equals: [{doc: 'sys.id'}, entityId]}
        ]}
      }]};
    }

    function assetPathPolicy (path, effect) {
      return {policies: [{
        effect: (effect || 'allow'),
        actions: ['update'],
        constraint: {and: [
          {equals: [{doc: 'sys.type'}, 'Asset']},
          {paths: [{doc: path}]}
        ]}
      }]};
    }

    function test (field, locale, expectation) {
      const ctId = arguments.length === 4 ? arguments[3] : 'ctid';
      expect(pac.canEditFieldLocale(ctId, field, locale)).toBe(expectation);
    }

    it('returns false by default', () => {
      test({}, {}, false);
    });

    it('returns true for admin', () => {
      setRole(undefined, true);
      test({}, {}, true);
    });

    it('returns true for admin even for paths that do not match', () => {
      setRole(pathPolicy('fields.other.%'), true);
      test({apiName: 'test'}, {}, true);
    });

    it('returns false if policy states: field - other than given, locale - any', () => {
      setRole(pathPolicy('fields.other.%'));
      test({apiName: 'test'}, {}, false);
    });

    it('returns false if policy states: field - any, locale - other than given', () => {
      setRole(pathPolicy('fields.%.en'));
      test({apiName: 'test'}, {code: 'pl'}, false);
    });

    it('returns false if policy states: field - other than given, locale - other than given', () => {
      setRole(pathPolicy('fields.other.en'));
      test({apiName: 'test'}, {code: 'pl'}, false);
    });

    it('returns true if policy states: field - given, locale - any', () => {
      setRole(pathPolicy('fields.test.%'));
      test({apiName: 'test'}, {}, true);
    });

    it('returns true if policy states: field - any, locale - given', () => {
      setRole(pathPolicy('fields.%.en'));
      test({apiName: 'somefield'}, {code: 'en'}, true);
    });

    it('returns true if policy states: field - give, locale - given', () => {
      setRole(pathPolicy('fields.test.pl'));
      test({apiName: 'test'}, {code: 'pl'}, true);
    });

    it('returns false if there is overriding policy', () => {
      const p1 = pathPolicy('fields.test.pl');
      const p2 = pathPolicy('fields.test.pl', 'deny');
      setRole({policies: _.union(p1.policies, p2.policies)});
      test({apiName: 'test'}, {code: 'pl'}, false);
    });

    it('returns false if there is partially overriding policy', () => {
      const p1 = pathPolicy('fields.test.pl');
      const p2 = pathPolicy('fields.%.pl', 'deny');
      setRole({policies: _.union(p1.policies, p2.policies)});
      test({apiName: 'test'}, {code: 'pl'}, false);
    });

    it('uses legacy field ID property if apiName is not available', () => {
      setRole(pathPolicy('fields.test.%'));
      test({id: 'test'}, {code: 'pl'}, true);
    });

    it('returns false if CT does not match', () => {
      setRole(pathPolicy('fields.test.pl'));
      test({apiName: 'test'}, {code: 'pl'}, false, 'x');
    });

    it('returns true if entity has been allowed by ID', () => {
      setRole(allowIdPolicy('entry1'));
      test({apiName: 'test'}, {code: 'pl'}, true);
    });

    it('returns false if entity has been denied by ID', () => {
      setRole(denyIdPolicy('entry1'));
      test({apiName: 'test'}, {code: 'pl'}, false);
    });

    it('returns false for asset field w/o allow policies', () => {
      test({}, {}, false, undefined);
    });

    it('returns false for asset with policy allowing editing other locale', () => {
      setRole(assetPathPolicy('fields.%.en'));
      test({}, {code: 'pl'}, false, undefined);
    });

    it('returns true for asset with allowing policy', () => {
      setRole(assetPathPolicy('fields.%.en'));
      test({}, {code: 'en'}, true, undefined);
    });

    it('merges policies from two roles in a master environment', () => {
      pac.setMembership({admin: false, roles: [roles.allowReadEntry]}, {environment: {sys: { isMaster: true }}});
      expect(pac.canEditFieldLocale('ctid', {}, {})).toBe(false);

      pac.setMembership({admin: false, roles: [
        roles.allowReadEntry,
        roles.allowReadAndEditOfEntry('ctid')
      ]});
      expect(pac.canEditFieldLocale('ctid', {}, {})).toBe(true);
    });

    it('merges policies from two roles in a non master environment', () => {
      pac.setMembership({admin: false, roles: [roles.allowReadEntry]}, {environment: {sys: { isMaster: false }}});
      expect(pac.canEditFieldLocale('ctid', {}, {})).toBe(true);

      pac.setMembership({admin: false, roles: [
        roles.allowReadEntry,
        roles.allowReadAndEditOfEntry('ctid')
      ]});
      expect(pac.canEditFieldLocale('ctid', {}, {})).toBe(true);
    });
  });
});
