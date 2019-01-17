import { isValidResourceId } from './utils.es6';

describe('isValidResourceId(id)', function() {
  test.each(['a', 'A', '_', '-', '.', '._-', 'x'.repeat(64), 'A_z-019.'.repeat(8)])(
    '`%s` is a valid resource ID',
    id => {
      expect(isValidResourceId(id)).toBe(true);
    }
  );

  test.each(['', 'x'.repeat(65), '$foo', '&bar', '@id'])('`%s` is a valid resource ID', id => {
    expect(isValidResourceId(id)).toBe(false);
  });
});
