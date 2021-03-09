import { createJsonPatch } from 'data/CMA/createJsonPatch';

describe('jsonPatch', () => {
  it('diffs against an empty objects', () => {
    const originalData = {};
    const updatedData = {
      fields: {
        field1: { 'en-US': 'foo' },
      },
    };
    expect(createJsonPatch(originalData, updatedData)).toEqual([
      { op: 'add', path: '/fields/field1', value: { 'en-US': 'foo' } },
    ]);
  });

  describe('when diffing object fields', () => {
    it('does not diff deeply by default', () => {
      const originalData = {
        fields: {
          field1: { 'en-US': { value: 'field1', value2: ['a', 'b', 'c'] } },
          field2: { 'en-US': 'field2' },
          field3: { 'en-US': ['test'] },
          field4: { 'en-US': ['test2'], 'de-DE': ['test3'] },
          field6: { 'en-US': 'IWILLBENULL' },
          field7: { 'en-US': 'foo' },
        },
      };

      const updatedData = {
        fields: {
          field1: { 'en-US': { value: 'field2', value2: ['c', 'b', 'a'] } },
          field2: { 'en-US': 'field2patched' },
          field4: { 'de-DE': ['test3'] },
          field5: { 'en-US': { some: 'text' }, 'de-DE': { some: { other: 'text' } } },
          field6: null,
          field7: { 'en-US': 'foo', 'de-DE': 'bar' },
        },
      };

      expect(createJsonPatch(originalData, updatedData)).toEqual([
        {
          op: 'add',
          path: '/fields/field7/de-DE',
          value: 'bar',
        },
        { op: 'remove', path: '/fields/field6/en-US' },
        { op: 'remove', path: '/fields/field4/en-US' },
        { op: 'remove', path: '/fields/field3/en-US' },
        { op: 'replace', path: '/fields/field2/en-US', value: 'field2patched' },
        {
          op: 'replace',
          path: '/fields/field1/en-US',
          value: { value: 'field2', value2: ['c', 'b', 'a'] },
        },
        {
          op: 'add',
          path: '/fields/field5',
          value: {
            'en-US': { some: 'text' },
            'de-DE': { some: { other: 'text' } },
          },
        },
      ]);
    });

    it('can diff deeply', () => {
      const originalData = {
        fields: {
          field1: { 'en-US': { value: 'field1' } },
        },
      };

      const updatedData = {
        fields: {
          field1: { 'en-US': { value: 'field2-changed', value3: 'value3' } },
        },
      };

      expect(createJsonPatch(originalData, updatedData, { diffNestedValues: true })).toEqual([
        { op: 'replace', path: '/fields/field1/en-US/value', value: 'field2-changed' },
        { op: 'add', path: '/fields/field1/en-US/value3', value: 'value3' },
      ]);
    });

    it('handles falsey value diffs properly', () => {
      const originalData = {
        fields: {
          field1: { 'en-US': { value: 'foo' } },
          field2: { 'en-US': { value: 'bar' } },
          field3: { 'en-US': { value: 'baz' } },
          field4: { 'en-US': { value: 'quux' } },
          field5: { 'en-US': { value: 'doge' } },
        },
      };

      const updatedData = {
        fields: {
          field1: { 'en-US': null },
          field2: { 'en-US': 0 },
          field3: { 'en-US': false },
          field4: { 'en-US': '' },
          field5: { 'en-US': undefined },
        },
      };

      expect(createJsonPatch(originalData, updatedData).reverse()).toEqual([
        { op: 'replace', path: '/fields/field1/en-US', value: null },
        { op: 'replace', path: '/fields/field2/en-US', value: 0 },
        { op: 'replace', path: '/fields/field3/en-US', value: false },
        { op: 'replace', path: '/fields/field4/en-US', value: '' },
        { op: 'remove', path: '/fields/field5/en-US' },
      ]);
    });
  });

  describe('when diffing object metadata tags', () => {
    it('diffs metadata tags property when metadata exists on original and updated data', () => {
      const originalData = {
        fields: {
          field1: { 'en-US': { value: 'field1', value2: ['a', 'b', 'c'] } },
        },
        metadata: {
          tags: [{ sys: { id: 'tag1' } }, { sys: { id: 'tag2' } }],
        },
      };

      const updatedData = {
        fields: {
          field1: { 'en-US': { value: 'field2', value2: ['c', 'b', 'a'] } },
        },
        metadata: {
          tags: [{ sys: { id: 'tag1' } }],
        },
      };

      expect(createJsonPatch(originalData, updatedData)).toEqual([
        {
          op: 'remove',
          path: '/metadata/tags/1',
        },
        {
          op: 'replace',
          path: '/fields/field1/en-US',
          value: { value: 'field2', value2: ['c', 'b', 'a'] },
        },
      ]);
    });

    it('does not diff metadata tags property if metadata exists only in the original data', () => {
      const originalData = {
        fields: {
          field1: { 'en-US': { value: 'field1', value2: ['a', 'b', 'c'] } },
        },
        metadata: {
          tags: [{ sys: { id: 'tag1' } }],
        },
      };

      const updatedData = {
        fields: {
          field1: { 'en-US': { value: 'field2', value2: ['c', 'b', 'a'] } },
        },
      };

      expect(createJsonPatch(originalData, updatedData)).toEqual([
        {
          op: 'replace',
          path: '/fields/field1/en-US',
          value: { value: 'field2', value2: ['c', 'b', 'a'] },
        },
      ]);
    });

    it('does not diff metadata tags property if metadata exists only in the updated data', () => {
      const originalData = {
        fields: {
          field1: { 'en-US': { value: 'field1', value2: ['a', 'b', 'c'] } },
        },
      };

      const updatedData = {
        fields: {
          field1: { 'en-US': { value: 'field2', value2: ['c', 'b', 'a'] } },
        },
        metadata: {
          tags: [{ sys: { id: 'tag1' } }],
        },
      };

      expect(createJsonPatch(originalData, updatedData)).toEqual([
        {
          op: 'replace',
          path: '/fields/field1/en-US',
          value: { value: 'field2', value2: ['c', 'b', 'a'] },
        },
      ]);
    });
  });
});
