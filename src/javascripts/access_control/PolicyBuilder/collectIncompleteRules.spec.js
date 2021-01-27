import { toInternal } from './toInternal';
import { collectIncompleteRules, MISSING_ATTRIBUTES } from './collectIncompleteRules';

describe('The collectIncompleteRules function', () => {
  function createPolicy({ ctId, path, type, effect, constraint, noFields = false }) {
    return {
      effect: effect || 'allow',
      actions: ['update'],
      constraint: constraint || {
        and: [
          { equals: [{ doc: 'sys.type' }, type || 'Entry'] }, // type
          { equals: [{ doc: 'sys.id' }, 'entityid1'] }, // entity
          { equals: [{ doc: 'sys.contentType.sys.id' }, ctId] }, // content type
          { in: [{ doc: 'metadata.tags.sys.id' }, ['tagid1', 'tagid2']] }, // tags
          ...(noFields ? [] : [{ paths: [{ doc: path || 'fields.fieldid1.en-US' }] }]), // content field & localization
        ],
      },
    };
  }

  function createContentType(id, fields) {
    return {
      sys: { id: id },
      fields: fields || [
        {
          id: 'fieldid1',
          apiName: 'fieldid1',
        },
      ],
    };
  }

  function getAttributes(props = {}) {
    return {
      contentTypes: [createContentType('ctid1'), createContentType('ctid2')],
      entityIds: ['entityid1', 'entityid2'],
      locales: [
        {
          code: 'en-US',
          name: 'English (United States) (en-US)',
        },
      ],
      tagIds: ['tagid1', 'tagid2'],
      ...props,
    };
  }

  describe('adds correct info to incompleteRulesList', () => {
    it('if content type is missing', () => {
      const internal = toInternal({
        policies: [createPolicy({ ctId: 'ctid1', noFields: true })],
      });
      const props = { contentTypes: [createContentType('ctid3')] };
      const attributes = getAttributes(props);
      const result = collectIncompleteRules({ internal, ...attributes });

      expect(Object.values(result)).toHaveLength(1);
      expect(Object.values(result)[0]).toHaveLength(1);
      expect(Object.values(result)[0][0]).toEqual(MISSING_ATTRIBUTES.contentType);
    });

    it('if field is missing', () => {
      const internal = toInternal({
        policies: [createPolicy({ ctId: 'ctid1' })],
      });
      const props = { contentTypes: [createContentType('ctid1', [])] };
      const attributes = getAttributes(props);
      const result = collectIncompleteRules({ internal, ...attributes });

      expect(Object.values(result)).toHaveLength(1);
      expect(Object.values(result)[0]).toHaveLength(1);
      expect(Object.values(result)[0][0]).toEqual(MISSING_ATTRIBUTES.field);
    });

    it('if entry is missing', () => {
      const internal = toInternal({
        policies: [createPolicy({ ctId: 'ctid1' })],
      });
      const props = { entityIds: ['entityid3'] };
      const attributes = getAttributes(props);
      const result = collectIncompleteRules({ internal, ...attributes });

      expect(Object.values(result)).toHaveLength(1);
      expect(Object.values(result)[0]).toHaveLength(1);
      expect(Object.values(result)[0][0]).toEqual(MISSING_ATTRIBUTES.entry);
    });

    it('if asset is missing', () => {
      const internal = toInternal({
        policies: [createPolicy({ ctId: 'ctid1', type: 'Asset' })],
      });
      const props = { entityIds: ['entityid3'] };
      const attributes = getAttributes(props);
      const result = collectIncompleteRules({ internal, ...attributes });

      expect(Object.values(result)).toHaveLength(1);
      expect(Object.values(result)[0]).toHaveLength(1);
      expect(Object.values(result)[0][0]).toEqual(MISSING_ATTRIBUTES.asset);
    });

    it('if locale is missing', () => {
      const internal = toInternal({
        policies: [createPolicy({ ctId: 'ctid1' })],
      });
      const props = { locales: [] };
      const attributes = getAttributes(props);
      const result = collectIncompleteRules({ internal, ...attributes });

      expect(Object.values(result)).toHaveLength(1);
      expect(Object.values(result)[0]).toHaveLength(1);
      expect(Object.values(result)[0][0]).toEqual(MISSING_ATTRIBUTES.locale);
    });

    it('if all tags are missing', () => {
      const internal = toInternal({
        policies: [createPolicy({ ctId: 'ctid1' })],
      });
      const props = { tagIds: [] };
      const attributes = getAttributes(props);
      const result = collectIncompleteRules({ internal, ...attributes });

      expect(Object.values(result)).toHaveLength(1);
      expect(Object.values(result)[0]).toHaveLength(1);
      expect(Object.values(result)[0][0]).toEqual(MISSING_ATTRIBUTES.tags);
    });

    it('if several attributes are missing', () => {
      const internal = toInternal({
        policies: [createPolicy({ ctId: 'ctid1' })],
      });
      const props = { contentTypes: [], entityIds: [], locales: [], tagIds: [] };
      const attributes = getAttributes(props);
      const result = collectIncompleteRules({ internal, ...attributes });

      expect(Object.values(result)).toHaveLength(1);
      expect(Object.values(result)[0]).toHaveLength(5);
      expect(Object.values(result)[0]).toEqual([
        MISSING_ATTRIBUTES.contentType,
        MISSING_ATTRIBUTES.field,
        MISSING_ATTRIBUTES.entry,
        MISSING_ATTRIBUTES.locale,
        MISSING_ATTRIBUTES.tags,
      ]);
    });
  });

  describe('does not add to incompleteRulesList', () => {
    it('if there are no constraints', () => {
      const internal = toInternal({
        policies: [createPolicy({ ctId: 'ctid1', constraint: [] })],
      });
      const props = { contentTypes: [], entityIds: [], locales: [], tagIds: [] };
      const attributes = getAttributes(props);
      const result = collectIncompleteRules({ internal, ...attributes });

      expect(Object.values(result)).toHaveLength(0);
    });

    it('if nothing is missing', () => {
      const internal = toInternal({
        policies: [createPolicy({ ctId: 'ctid1' })],
      });
      const attributes = getAttributes();
      const result = collectIncompleteRules({ internal, ...attributes });

      expect(Object.values(result)).toHaveLength(0);
    });

    it('if only some tags are missing', () => {
      const internal = toInternal({
        policies: [createPolicy({ ctId: 'ctid1', constraint: [] })],
      });
      const props = { tags: ['tagid2'] };
      const attributes = getAttributes(props);
      const result = collectIncompleteRules({ internal, ...attributes });

      expect(Object.values(result)).toHaveLength(0);
    });

    it('if field is missing but path constraint is metadata.tag', () => {
      const internal = toInternal({
        policies: [createPolicy({ ctId: 'ctid1', path: 'metadata.tags.%' })],
      });
      const props = { contentTypes: [createContentType('ctid1', [])] };
      const attributes = getAttributes(props);
      const result = collectIncompleteRules({ internal, ...attributes });

      expect(Object.values(result)).toHaveLength(0);
    });
  });

  it('checks rules from all rule sets', () => {
    const internal = toInternal({
      policies: [
        createPolicy({ ctId: 'ctid_a', type: 'Entry', effect: 'allow' }),
        createPolicy({ ctId: 'ctid_b', type: 'Entry', effect: 'deny' }),
        createPolicy({ ctId: 'ctid_c', type: 'Asset', effect: 'allow' }),
        createPolicy({ ctId: 'ctid_d', type: 'Asset', effect: 'deny' }),
      ],
    });

    const props = { contentTypes: [], entityIds: [], locales: [], tagIds: [] };
    const attributes = getAttributes(props);
    const result = collectIncompleteRules({ internal, ...attributes });

    expect(Object.values(result)).toHaveLength(4);
  });

  it('does not change the "internal" object', () => {
    const internal = toInternal({
      policies: [
        createPolicy({ ctId: 'ctid_a', type: 'Entry', effect: 'allow' }),
        createPolicy({ ctId: 'ctid_b', type: 'Entry', effect: 'deny' }),
        createPolicy({ ctId: 'ctid_c', type: 'Asset', effect: 'allow' }),
        createPolicy({ ctId: 'ctid_d', type: 'Asset', effect: 'deny' }),
      ],
    });
    const before = JSON.stringify(internal);
    const attributes = getAttributes();
    collectIncompleteRules({ internal, ...attributes });
    const after = JSON.stringify(internal);

    expect(before).toEqual(after);
  });
});
