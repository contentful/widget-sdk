'use strict';

describe('Policy Builder, to internal representation', () => {
  let toInternal, CONFIG;

  beforeEach(function () {
    module('contentful/test');
    toInternal = this.$inject('PolicyBuilder/toInternal');
    CONFIG = this.$inject('PolicyBuilder/CONFIG');
  });

  describe('takes external and returns internal representation', () => {
    it('extracts id and version', () => {
      const internal = toInternal({sys: {id: 'testid', version: 123}});
      expect(internal.id).toBe('testid');
      expect(internal.version).toBe(123);
    });

    it('uses the same name and description', () => {
      const internal = toInternal({name: 'name', description: 'desc'});
      expect(internal.name).toBe('name');
      expect(internal.description).toBe('desc');
    });

    it('clones permissions', () => {
      const permissions = {contentDelivery: ['read', 'manage'], settings: ['read']};
      const internal = toInternal({permissions: permissions});
      expect(internal.contentDelivery !== permissions.contentDelivery).toBe(true);
      expect(internal.settings !== permissions.settings).toBe(true);
      expect(internal.contentDelivery[1]).toBe('manage');
      expect(internal.settings[0]).toBe('read');
    });

    it('adds collections', () => {
      const i = toInternal({});
      [i.entries.allowed, i.entries.denied, i.assets.allowed, i.assets.denied].forEach(collection => {
        expect(Array.isArray(collection)).toBe(true);
        expect(collection.length).toBe(0);
      });
    });

    it('adds policyString and uiCompatible flag', () => {
      const internal = toInternal({policies: []});
      expect(internal.policyString).toBe('[]');
      expect(internal.uiCompatible).toBe(true);
    });
  });

  describe('translating policies', () => {
    it('marks as non-UI-compatible', () => {
      // no constraint
      let internal = toInternal({policies: [
        {actions: 'all', effect: 'allow'}
      ]});
      expect(internal.uiCompatible).toBe(false);

      // "or" constraint
      internal = toInternal({policies: [
        {actions: 'all', effect: 'allow', constraint: {
          or: [
            {equals: [{doc: 'sys.type'}, 'Entry']},
            {equals: [{doc: 'sys.type'}, 'Asset']}
          ]
        }}
      ]});
      expect(internal.uiCompatible).toBe(false);

      // "equals" constraint
      internal = toInternal({policies: [
        {actions: 'all', effect: 'allow', constraint: {
          equals: [{doc: 'sys.type'}, 'Entry']
        }}
      ]});
      expect(internal.uiCompatible).toBe(false);
    });

    function base (type, collection, action) {
      const internal = toInternal({policies: [
        {actions: action, effect: 'allow', constraint: {
          and: [{equals: [{doc: 'sys.type'}, type]}]
        }}
      ]});

      const as = internal[collection].allowed;
      expect(as.length).toBe(1);
      expect(as[0].entity).toBe(type.toLowerCase());
      expect(as[0].action).toBe(Array.isArray(action) ? action[0] : action);
    }

    it('translates base for entry and action', () => {
      base('Entry', 'entries', 'all');
      base('Entry', 'entries', ['read']);
      base('Entry', 'entries', ['create']);
    });

    it('translates base for assets and action', () => {
      base('Asset', 'assets', 'all');
      base('Asset', 'assets', ['read']);
      base('Asset', 'assets', ['create']);
    });

    it('translates content type constraints', () => {
      const internal = toInternal({policies: [
        {actions: 'all', effect: 'allow', constraint: {
          and: [ { equals: [{doc: 'sys.type'}, 'Entry'] } ]
        }},
        {actions: 'all', effect: 'allow', constraint: {
          and: [
            { equals: [{doc: 'sys.type'}, 'Entry'] },
            { equals: [{doc: 'sys.contentType.sys.id'}, 'ctid'] }
          ]
        }}
      ]});

      expect(internal.entries.allowed[0].contentType).toBe(CONFIG.ALL_CTS);
      expect(internal.entries.allowed[1].contentType).toBe('ctid');
    });

    it('translates multiple policies with exceptions', () => {
      const internal = toInternal({policies: [
        {actions: 'all', effect: 'allow', constraint: {
          and: [ { equals: [{doc: 'sys.type'}, 'Entry'] } ]
        }},
        {actions: ['create'], effect: 'deny', constraint: {
          and: [ { equals: [{doc: 'sys.type'}, 'Entry'] } ]
        }},
        {actions: ['update'], effect: 'deny', constraint: {
          and: [ { equals: [{doc: 'sys.type'}, 'Entry'] } ]
        }}
      ]});

      expect(internal.entries.allowed.length).toBe(1);
      expect(internal.entries.denied.length).toBe(2);
      expect(internal.entries.denied[0].action).toBe('create');
    });

    it('translates scope', () => {
      const internal = toInternal({policies: [
        {actions: ['read'], effect: 'allow', constraint: {
          and: [ { equals: [{doc: 'sys.type'}, 'Entry'] } ]
        }},
        {actions: ['update'], effect: 'allow', constraint: {
          and: [
            { equals: [{doc: 'sys.type'}, 'Entry'] },
            { equals: [{doc: 'sys.createdBy.sys.id'}, 'User.current()'] }
          ]
        }}
      ]});

      expect(internal.entries.allowed.length).toBe(2);
      expect(internal.entries.allowed[0].scope).toBe('any');
      expect(internal.entries.allowed[1].scope).toBe('user');
    });

    it('translates path (field, locale)', () => {
      const internal = toInternal({policies: [
        {actions: ['read'], effect: 'allow', constraint: {
          and: [
            { equals: [{doc: 'sys.type'}, 'Entry'] },
            { paths: [{doc: 'fields.%.en-US'}] }
          ]
        }},
        {actions: ['read'], effect: 'allow', constraint: {
          and: [
            { equals: [{doc: 'sys.type'}, 'Entry'] },
            { paths: [{doc: 'fields.test.%'}] }
          ]
        }},
        {actions: ['read'], effect: 'allow', constraint: {
          and: [
            { equals: [{doc: 'sys.type'}, 'Entry'] },
            { paths: [{doc: 'fields.%.%'}] }
          ]
        }},
        {actions: ['read'], effect: 'allow', constraint: {
          and: [{ equals: [{doc: 'sys.type'}, 'Entry'] }]
        }}
      ]});

      expect(internal.entries.allowed.length).toBe(4);
      expect(internal.entries.allowed[0].isPath).toBe(true);
      expect(internal.entries.allowed[0].field).toBe(CONFIG.ALL_FIELDS);
      expect(internal.entries.allowed[0].locale).toBe('en-US');
      expect(internal.entries.allowed[0].isPath).toBe(true);
      expect(internal.entries.allowed[1].field).toBe('test');
      expect(internal.entries.allowed[1].locale).toBe(CONFIG.ALL_LOCALES);
      expect(internal.entries.allowed[2].isPath).toBe(true);
      expect(internal.entries.allowed[3].isPath).toBeUndefined();
    });

    it('translates "glued" actions', () => {
      let internal = toInternal({policies: [
        {actions: ['publish', 'unpublish'], effect: 'allow', constraint: {
          and: [ { equals: [{doc: 'sys.type'}, 'Entry'] } ]
        }},
        {actions: ['archive', 'unarchive'], effect: 'allow', constraint: {
          and: [ { equals: [{doc: 'sys.type'}, 'Entry'] } ]
        }}
      ]});

      expect(internal.entries.allowed[0].action).toBe('publish');
      expect(internal.entries.allowed[1].action).toBe('archive');

      internal = toInternal({policies: [
        {actions: ['publish'], effect: 'allow', constraint: {
          and: [ { equals: [{doc: 'sys.type'}, 'Entry'] } ]
        }}
      ]});

      expect(internal.uiCompatible).toBe(false);
    });
  });
});
