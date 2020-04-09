import { forEach, omit } from 'lodash';
import changedEntityFieldPaths from './changedEntityFieldPaths';

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
