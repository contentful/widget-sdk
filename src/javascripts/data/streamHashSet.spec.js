import * as K from '../../../test/utils/kefir';
import _ from 'lodash';

import { create } from 'data/streamHashSet';

describe('data/StreamHashSet', () => {
  let store, itemValues;
  beforeEach(async function () {
    store = create();

    itemValues = K.extractValues(store.items$);
  });

  describe('#add()', () => {
    it('makes item retrievable with #get()', function () {
      expect(store.get('X')).toBeUndefined();
      const item = makeItem('X');
      store.add(item);
      expect(store.get('X')).toBe(item);
    });

    it('emits new items value', function () {
      const item1 = makeItem('1');
      store.add(item1);

      const item2 = makeItem('2');
      store.add(item2);

      expect(itemValues).toEqual([[item1, item2], [item1], []]);
    });
  });

  describe('#remove()', () => {
    it('makes item not retrievable with #get()', function () {
      const item = makeItem('X');
      store.add(item);
      expect(store.get('X')).toBe(item);

      store.remove(item);
      expect(store.get('X')).toBeUndefined();
    });

    it('emits new items value', function () {
      const item1 = makeItem('1');
      const item2 = makeItem('2');
      store.reset([item1, item2]);
      store.remove(item1);

      expect(itemValues).toEqual([[item2], [item1, item2], []]);
    });
  });

  describe('#reset()', () => {
    it('adds new items', function () {
      const item1 = makeItem('1');
      const item2 = makeItem('2');
      store.reset([item1, item2]);

      expect(itemValues[0]).toEqual([item1, item2]);
      expect(store.get('1')).toBe(item1);
      expect(store.get('2')).toBe(item2);
    });

    it('evicts old items', function () {
      const old = makeItem('old');
      store.add(old);
      expect(store.get('old')).toBe(old);

      store.reset([makeItem('new')]);
      expect(store.get('old')).toBeUndefined();
    });
  });

  function makeItem(id) {
    return {
      id: id,
      getId: _.constant(id),
    };
  }
});
