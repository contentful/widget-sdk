import { toInternal } from './toInternal';
import { PolicyBuilderConfig } from './PolicyBuilderConfig';

describe('Policy Builder, to internal representation', () => {
  describe('takes external and returns internal representation', () => {
    it('extracts id and version', () => {
      const internal = toInternal({ sys: { id: 'testid', version: 123 } });
      expect(internal.id).toBe('testid');
      expect(internal.version).toBe(123);
    });

    it('uses the same name and description', () => {
      const internal = toInternal({ name: 'name', description: 'desc' });
      expect(internal.name).toBe('name');
      expect(internal.description).toBe('desc');
    });

    it('clones permissions', () => {
      const permissions = { contentDelivery: ['read', 'manage'], settings: ['read'] };
      const internal = toInternal({ permissions: permissions });
      expect(internal.contentDelivery !== permissions.contentDelivery).toBe(true);
      expect(internal.settings !== permissions.settings).toBe(true);
      expect(internal.contentDelivery[1]).toBe('manage');
      expect(internal.settings[0]).toBe('read');
    });

    it('adds collections', () => {
      const i = toInternal({});
      [i.entries.allowed, i.entries.denied, i.assets.allowed, i.assets.denied].forEach(
        (collection) => {
          expect(Array.isArray(collection)).toBe(true);
          expect(collection).toHaveLength(0);
        }
      );
    });

    it('adds policyString and uiCompatible flag', () => {
      const internal = toInternal({ policies: [] });
      expect(internal.policyString).toBe('[]');
      expect(internal.uiCompatible).toBe(true);
      expect(internal.metadataTagRuleExists).toBe(false);
    });
  });

  describe('translating policies', () => {
    it('marks as non-UI-compatible', () => {
      // no constraint
      let internal = toInternal({
        policies: [{ actions: 'all', effect: 'allow' }],
      });
      expect(internal.uiCompatible).toBe(false);
      expect(internal.metadataTagRuleExists).toBe(false);

      // "or" constraint
      internal = toInternal({
        policies: [
          {
            actions: 'all',
            effect: 'allow',
            constraint: {
              or: [
                { equals: [{ doc: 'sys.type' }, 'Entry'] },
                { equals: [{ doc: 'sys.type' }, 'Asset'] },
              ],
            },
          },
        ],
      });
      expect(internal.uiCompatible).toBe(false);

      // "equals" constraint
      internal = toInternal({
        policies: [
          {
            actions: 'all',
            effect: 'allow',
            constraint: {
              equals: [{ doc: 'sys.type' }, 'Entry'],
            },
          },
        ],
      });
      expect(internal.uiCompatible).toBe(false);
    });

    function base(type, collection, action) {
      const internal = toInternal({
        policies: [
          {
            actions: action,
            effect: 'allow',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, type] }],
            },
          },
        ],
      });

      const as = internal[collection].allowed;
      expect(as).toHaveLength(1);
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
      const internal = toInternal({
        policies: [
          {
            actions: 'all',
            effect: 'allow',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, 'Entry'] }],
            },
          },
          {
            actions: 'all',
            effect: 'allow',
            constraint: {
              and: [
                { equals: [{ doc: 'sys.type' }, 'Entry'] },
                { equals: [{ doc: 'sys.contentType.sys.id' }, 'ctid'] },
              ],
            },
          },
        ],
      });

      expect(internal.entries.allowed[0].contentType).toBe(PolicyBuilderConfig.ALL_CTS);
      expect(internal.entries.allowed[1].contentType).toBe('ctid');
    });

    it('translates metadata tag id constraints', () => {
      const internal = toInternal({
        policies: [
          {
            actions: 'all',
            effect: 'allow',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, 'Entry'] }],
            },
          },
          {
            actions: 'all',
            effect: 'allow',
            constraint: {
              and: [
                { equals: [{ doc: 'sys.type' }, 'Entry'] },
                { equals: [{ doc: 'metadata.tags.sys.id' }, ['tagId']] },
              ],
            },
          },
        ],
      });

      expect(internal.entries.allowed[1].scope).toBe('metadataTagId');
      expect(internal.entries.allowed[1].metadataTagId).toEqual(['tagId']);
      expect(internal.uiCompatible).toBe(true);
      expect(internal.metadataTagRuleExists).toBe(true);
    });

    it('translates metadata tag type constraints', () => {
      const internal = toInternal({
        policies: [
          {
            actions: 'all',
            effect: 'allow',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, 'Entry'] }],
            },
          },
          {
            actions: 'all',
            effect: 'allow',
            constraint: {
              and: [
                { equals: [{ doc: 'sys.type' }, 'Entry'] },
                { in: [{ doc: 'metadata.tags.sys.tagType' }, ['Access']] },
              ],
            },
          },
        ],
      });

      expect(internal.entries.allowed[1].scope).toBe('metadataTagType');
      expect(internal.entries.allowed[1].metadataTagType).toEqual(['Access']);
      expect(internal.uiCompatible).toBe(true);
      expect(internal.metadataTagRuleExists).toBe(true);
    });

    it('translates multiple policies with exceptions', () => {
      const internal = toInternal({
        policies: [
          {
            actions: 'all',
            effect: 'allow',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, 'Entry'] }],
            },
          },
          {
            actions: ['create'],
            effect: 'deny',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, 'Entry'] }],
            },
          },
          {
            actions: ['update'],
            effect: 'deny',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, 'Entry'] }],
            },
          },
        ],
      });

      expect(internal.entries.allowed).toHaveLength(1);
      expect(internal.entries.denied).toHaveLength(2);
      expect(internal.entries.denied[0].action).toBe('create');
    });

    it('translates scope', () => {
      const internal = toInternal({
        policies: [
          {
            actions: ['read'],
            effect: 'allow',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, 'Entry'] }],
            },
          },
          {
            actions: ['update'],
            effect: 'allow',
            constraint: {
              and: [
                { equals: [{ doc: 'sys.type' }, 'Entry'] },
                { equals: [{ doc: 'sys.createdBy.sys.id' }, 'User.current()'] },
              ],
            },
          },
        ],
      });

      expect(internal.entries.allowed).toHaveLength(2);
      expect(internal.entries.allowed[0].scope).toBe('any');
      expect(internal.entries.allowed[1].scope).toBe('user');
    });

    it('translates path (field, locale)', () => {
      const internal = toInternal({
        policies: [
          {
            actions: ['read'],
            effect: 'allow',
            constraint: {
              and: [
                { equals: [{ doc: 'sys.type' }, 'Entry'] },
                { paths: [{ doc: 'fields.%.en-US' }] },
              ],
            },
          },
          {
            actions: ['read'],
            effect: 'allow',
            constraint: {
              and: [
                { equals: [{ doc: 'sys.type' }, 'Entry'] },
                { paths: [{ doc: 'fields.test.%' }] },
              ],
            },
          },
          {
            actions: ['read'],
            effect: 'allow',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, 'Entry'] }, { paths: [{ doc: 'fields.%.%' }] }],
            },
          },
          {
            actions: ['read'],
            effect: 'allow',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, 'Entry'] }],
            },
          },
        ],
      });

      expect(internal.entries.allowed).toHaveLength(4);
      expect(internal.entries.allowed[0].isPath).toBe(true);
      expect(internal.entries.allowed[0].field).toBe(PolicyBuilderConfig.ALL_FIELDS);
      expect(internal.entries.allowed[0].locale).toBe('en-US');
      expect(internal.entries.allowed[0].isPath).toBe(true);
      expect(internal.entries.allowed[1].field).toBe('test');
      expect(internal.entries.allowed[1].locale).toBe(PolicyBuilderConfig.ALL_LOCALES);
      expect(internal.entries.allowed[2].isPath).toBe(true);
      expect(internal.entries.allowed[3].isPath).toBeUndefined();
    });

    it('translates "glued" actions', () => {
      let internal = toInternal({
        policies: [
          {
            actions: ['publish', 'unpublish'],
            effect: 'allow',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, 'Entry'] }],
            },
          },
          {
            actions: ['archive', 'unarchive'],
            effect: 'allow',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, 'Entry'] }],
            },
          },
        ],
      });

      expect(internal.entries.allowed[0].action).toBe('publish');
      expect(internal.entries.allowed[1].action).toBe('archive');

      internal = toInternal({
        policies: [
          {
            actions: ['publish'],
            effect: 'allow',
            constraint: {
              and: [{ equals: [{ doc: 'sys.type' }, 'Entry'] }],
            },
          },
        ],
      });

      expect(internal.uiCompatible).toBe(false);
      expect(internal.metadataTagRuleExists).toBe(false);
    });
  });
});
