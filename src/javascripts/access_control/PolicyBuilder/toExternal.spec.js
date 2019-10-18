import _ from 'lodash';
import { toExternal } from './toExternal';
import { PolicyBuilderConfig } from './PolicyBuilderConfig';

describe('Policy Builder, to external representation', () => {
  describe('takes internal and returns external representation', () => {
    it('creates sys object with id and version', () => {
      const external = toExternal({ id: 'testid', version: 123 });
      expect(_.isObject(external.sys)).toBe(true);
      expect(external.sys.id).toBe('testid');
      expect(external.sys.version).toBe(123);
    });

    it('picks name and description', () => {
      const external = toExternal({ name: 'name', description: 'desc' });
      expect(external.name).toBe('name');
      expect(external.description).toBe('desc');
    });

    it('picks permissions to object', () => {
      const external = toExternal({
        contentModel: 'all',
        contentDelivery: 'all',
        settings: 'all',
        environments: 'all',
        environmentAliases: 'all'
      });
      expect(external.permissions.contentModel).toBe('all');
      expect(external.permissions.contentDelivery).toBe('all');
      expect(external.permissions.settings).toBe('all');
      expect(external.permissions.environments).toBe('all');
      expect(external.permissions.environmentAliases).toBe('all');
    });
  });

  describe('translating non-ui-compatible policies', () => {
    it('returns parsed policy JSON string', () => {
      const external = toExternal({
        uiCompatible: false,
        policyString: '{"test": true}'
      });

      expect(external.policies.test).toBe(true);
    });

    it('returns null for an invalid JSON string', () => {
      const external = toExternal({
        uiCompatible: false,
        policyString: '{test": false}}'
      });

      expect(external.policies).toBeNull();
    });

    it('does not parse policyString with uiCompatible flag', () => {
      const external = toExternal({
        uiCompatible: true,
        policyString: '{"test": true}'
      });

      expect(Array.isArray(external.policies)).toBe(true);
      expect(external.policies).toHaveLength(0);
    });
  });

  describe('translating policies', () => {
    function baseExternal(collection, effect) {
      const internal = { uiCompatible: true };
      internal[collection] = {};
      internal[collection][effect] = [{}];
      return toExternal(internal);
    }

    function testBase(external, type, effect) {
      const p = external.policies[0];
      expect(p.effect).toBe(effect);
      expect(p.constraint.and[0].equals[0].doc).toBe('sys.type');
      expect(p.constraint.and[0].equals[1]).toBe(type);
    }

    it('adding content type and effect, allowed entries', () => {
      const external = baseExternal('entries', 'allowed');
      testBase(external, 'Entry', 'allow');
    });

    it('adding content type and effect, denied entries', () => {
      const external = baseExternal('entries', 'denied');
      testBase(external, 'Entry', 'deny');
    });

    it('adding content type and effect, allowed assets', () => {
      const external = baseExternal('assets', 'allowed');
      testBase(external, 'Asset', 'allow');
    });

    it('adding content type and effect, denied assets', () => {
      const external = baseExternal('assets', 'denied');
      testBase(external, 'Asset', 'deny');
    });

    it('parses policyString for non-UI-compatible policies', () => {
      const external = toExternal({
        uiCompatible: false,
        policyString: '{"test":true}'
      });

      expect(external.policies.test).toBe(true);
    });

    it('translating multiple policies with exceptions', () => {
      const external = toExternal({
        uiCompatible: true,
        entries: {
          allowed: [{ action: 'all' }],
          denied: [{ action: 'update' }]
        }
      });

      const ps = external.policies;

      expect(ps).toHaveLength(2);
      expect(ps[0].effect).toBe('allow');
      expect(ps[0].actions).toBe('all');
      expect(ps[0].constraint.and[0].equals[1]).toBe('Entry');

      expect(ps[1].effect).toBe('deny');
      expect(ps[1].actions[0]).toBe('update');
      expect(ps[1].constraint.and[0].equals[1]).toBe('Entry');
    });

    it('translates content types', () => {
      const external = toExternal({
        uiCompatible: true,
        entries: {
          allowed: [
            { action: 'read' },
            { action: 'read', contentType: PolicyBuilderConfig.ALL_CTS },
            { action: 'read', contentType: 'ctid' }
          ]
        }
      });

      const ps = external.policies;

      expect(ps[0].constraint.and[0].equals[1]).toBe('Entry');
      expect(ps[0].constraint.and).toHaveLength(1);

      expect(ps[1].constraint.and[0].equals[1]).toBe('Entry');
      expect(ps[1].constraint.and).toHaveLength(1);

      expect(ps[2].constraint.and[0].equals[1]).toBe('Entry');
      expect(ps[2].constraint.and).toHaveLength(2);
      expect(ps[2].constraint.and[1].equals[0].doc).toBe('sys.contentType.sys.id');
      expect(ps[2].constraint.and[1].equals[1]).toBe('ctid');
    });

    it('translates scope', () => {
      const external = toExternal({
        uiCompatible: true,
        entries: {
          allowed: [{ action: 'read', scope: 'any' }, { action: 'update', scope: 'user' }]
        }
      });

      const p = external.policies[1];
      expect(p.effect).toBe('allow');
      expect(p.actions[0]).toBe('update');
      expect(p.constraint.and[0].equals[1]).toBe('Entry');
      expect(p.constraint.and[1].equals[0].doc).toBe('sys.createdBy.sys.id');
      expect(p.constraint.and[1].equals[1]).toBe('User.current()');
    });

    it('translates path (field, locale)', () => {
      const external = toExternal({
        uiCompatible: true,
        entries: {
          allowed: [
            { action: 'update', field: PolicyBuilderConfig.ALL_FIELDS, locale: 'en-US' },
            { action: 'update', field: 'test', locale: PolicyBuilderConfig.ALL_LOCALES }
          ]
        }
      });

      const ps = external.policies;
      expect(ps[0].constraint.and[0].equals[1]).toBe('Entry');
      expect(ps[0].constraint.and[1].paths[0].doc).toBe('fields.%.en-US');
      expect(ps[1].constraint.and[0].equals[1]).toBe('Entry');
      expect(ps[1].constraint.and[1].paths[0].doc).toBe('fields.test.%');
    });

    it('translates "glued" actions', () => {
      const external = toExternal({
        uiCompatible: true,
        entries: {
          allowed: [{ action: 'publish' }, { action: 'archive' }]
        }
      });

      const ps = external.policies;
      expect(ps[0].actions[0]).toBe('publish');
      expect(ps[0].actions[1]).toBe('unpublish');
      expect(ps[1].actions[0]).toBe('archive');
      expect(ps[1].actions[1]).toBe('unarchive');
    });
  });
});
