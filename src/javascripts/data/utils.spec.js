import { isValidResourceId } from './utils';

describe('isValidResourceId(id)', function () {
  it.each(['a', 'A', '_', '-', '.', '._-', 'x'.repeat(64), 'A_z-019.'.repeat(8)])(
    '`%s` is a valid resource ID',
    (id) => {
      expect(isValidResourceId(id)).toBe(true);
    }
  );

  it.each(['', 'x'.repeat(65), '$foo', '&bar', '@id'])('`%s` is an invalid resource ID', (id) => {
    expect(isValidResourceId(id)).toBe(false);
  });
});
