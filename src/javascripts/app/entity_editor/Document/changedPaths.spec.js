import { forEach, omit } from 'lodash';
import { changedEntityFieldPaths, changedEntityMetadataPaths } from './changedPaths';
import * as fake from 'test/helpers/fakeFactory';

describe('changedEntityFieldPaths(fields1, fields2)', () => {
  const FIELDS = {
    fieldA: {
      'en-US': 'Hi A',
      de: 'Hallo A',
    },
    fieldB: {
      'en-US': 'Hi B',
    },
    fieldC: {
      de: 'Hi C',
    },
  };

  const testCases = {
    'identical empty fields': {
      fields1: {},
      fields2: {},
      result: [],
    },
    'identical fields': {
      fields1: FIELDS,
      fields2: FIELDS,
      result: [],
    },
    'identical fields with object values': {
      fields1: { fieldA: { en: { foo: 'bar' } } },
      fields2: { fieldA: { en: { foo: 'bar' } } },
      result: [],
    },
    'empty fields1': {
      fields1: {},
      fields2: FIELDS,
      result: [
        ['fieldA', 'en-US'],
        ['fieldA', 'de'],
        ['fieldB', 'en-US'],
        ['fieldC', 'de'],
      ],
    },
    'missing field, one locale': {
      fields1: FIELDS,
      fields2: omit(FIELDS, 'fieldC'),
      result: [['fieldC', 'de']],
    },
    'missing field, two locales': {
      fields1: FIELDS,
      fields2: omit(FIELDS, 'fieldA'),
      result: [
        ['fieldA', 'en-US'],
        ['fieldA', 'de'],
      ],
    },
    'missing field locale': {
      fields1: FIELDS,
      fields2: omit(FIELDS, 'fieldA.de'),
      result: [['fieldA', 'de']],
    },
    'missing pieces in both field objects': {
      fields1: omit(FIELDS, 'fieldA.de'),
      fields2: omit(FIELDS, 'fieldB'),
      result: [
        ['fieldA', 'de'],
        ['fieldB', 'en-US'],
      ],
    },
    'changed a field': {
      fields1: {
        fieldA: { 'en-US': 'fieldA.en-US' },
      },
      fields2: {
        fieldA: { 'en-US': '' },
      },
      result: [['fieldA', 'en-US']],
    },
  };

  forEach(testCases, (testCase, description) => {
    const { fields1, fields2, result } = testCase;

    it(`handles ${description}`, () => {
      expect(changedEntityFieldPaths(fields1, fields2)).toIncludeSameMembers(result);
      expect(changedEntityFieldPaths(fields2, fields1)).toIncludeSameMembers(result);
    });
  });
});

describe('changedEntityMetadataPaths', () => {
  const TAG_1 = fake.Link('Tag', 'tag1');
  const TAG_2 = fake.Link('Tag', 'tag2');
  const TAG_3 = fake.Link('Tag', 'tag3');

  const testCases = {
    'identical empty metadata': {
      metadata1: {},
      metadata2: {},
      result: [],
    },
    'undefined metadata': {
      metadata1: undefined,
      metadata2: undefined,
      result: [],
    },
    'undefined and empty metadata': {
      metadata1: undefined,
      metadata2: {},
      result: [],
    },
    'tag and empty metadata': {
      metadata1: {
        tags: [TAG_1],
      },
      metadata2: {},
      result: [['tags']],
    },
    'same tag': {
      metadata1: {
        tags: [TAG_1],
      },
      metadata2: {
        tags: [TAG_1],
      },
      result: [],
    },
    'additoinal tag': {
      metadata1: {
        tags: [TAG_1],
      },
      metadata2: {
        tags: [TAG_1, TAG_2],
      },
      result: [['tags']],
    },
    'same tags, same order': {
      metadata1: {
        tags: [TAG_1, TAG_2, TAG_3],
      },
      metadata2: {
        tags: [TAG_1, TAG_2, TAG_3],
      },
      result: [],
    },
    'same tags, different order': {
      metadata1: {
        tags: [TAG_1, TAG_2, TAG_3],
      },
      metadata2: {
        tags: [TAG_3, TAG_1, TAG_2],
      },
      result: [],
    },
    'different tags': {
      metadata1: {
        tags: [TAG_1, TAG_2],
      },
      metadata2: {
        tags: [TAG_1, TAG_3],
      },
      result: [['tags']],
    },
  };

  forEach(testCases, (testCase, description) => {
    const { metadata1, metadata2, result } = testCase;

    it(`handles ${description}`, () => {
      expect(changedEntityMetadataPaths(metadata1, metadata2)).toIncludeSameMembers(result);
      expect(changedEntityMetadataPaths(metadata2, metadata1)).toIncludeSameMembers(result);
    });
  });
});
