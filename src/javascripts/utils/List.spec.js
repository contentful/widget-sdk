import _ from 'lodash';
import * as List from './List.es6';

describe('utils/List.es6', () => {
  describe('#makeKeyed', () => {
    const makeKeyed = items => {
      return List.makeKeyed(items, i => i.hash);
    };

    // Define some commonly used items
    const a = { hash: 'a' };
    const b = { hash: 'b' };

    it('preserves values', function() {
      const items = [a, b, a];
      const keyed = makeKeyed(items);
      expect(keyed.map(i => i.value)).toEqual(items);
    });

    it('has unique keys', function() {
      const items = [a, b, a];
      const keyed = makeKeyed(items);
      const keys = keyed.map(i => i.key);
      expect(_.uniq(keys)).toHaveLength(keys.length);
    });

    it('same key implies same value', function() {
      const items1 = [a, b, a];
      const items2 = [a, a, b];

      const keyed1 = makeKeyed(items1);
      const keyed2 = makeKeyed(items2);
      expect(keyed1[2].key).toBe(keyed2[1].key);
      expect(keyed1[2].value).toBe(keyed2[1].value);
    });
  });
});
