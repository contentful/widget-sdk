import { getFirstDelimiterIndex, groupByField } from 'features/content-tags/editor/utils';

describe('utils', () => {
  describe(':getFirstDelimiterIndex', () => {
    const delimiters = [' ', '.', ':', '_', '-', '#'];
    it.each([
      ['Hello world', 5],
      ['Hello-world', 5],
      ['Hello_world', 5],
      ['Hello_world', 5],
      ['Hello:world-x', 5],
      ['Hello: world-x', 5],
      ['HelloWorld', -1],
    ])('for given input %p resulting index is %p', (input, result) => {
      expect(getFirstDelimiterIndex(input, delimiters)).toBe(result);
    });
  });

  describe('groupByField', () => {
    it('can group by delimiters', () => {
      const input = [
        { name: 'Hello World' },
        { name: 'Hello:World' },
        { name: 'Hello: World' },
        { name: 'HelloWorld' },
        { name: 'Hello_World' },
        { name: 'hello#World' },
        { name: 'hello.World' },
        { name: 'world hello' },
      ];

      const result = groupByField(input, 'name', [' ', '.', ':', '_', '-', '#']);
      expect(Object.keys(result)).toHaveLength(3);
      expect(Object.keys(result)).toEqual(['Hello', 'Uncategorized', 'World']);
    });
  });
});
