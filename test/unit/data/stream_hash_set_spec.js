import * as K from 'test/helpers/mocks/kefir';
import _ from 'lodash';

describe('data/StreamHashSet.es6', () => {
  beforeEach(async function() {
    this.store = (await this.system.import('data/streamHashSet.es6')).create();

    this.itemValues = K.extractValues(this.store.items$);
  });

  describe('#add()', () => {
    it('makes item retrievable with #get()', function() {
      expect(this.store.get('X')).toBe(undefined);
      const item = makeItem('X');
      this.store.add(item);
      expect(this.store.get('X')).toBe(item);
    });

    it('emits new items value', function() {
      const item1 = makeItem('1');
      this.store.add(item1);

      const item2 = makeItem('2');
      this.store.add(item2);

      expect(this.itemValues).toEqual([[item1, item2], [item1], []]);
    });
  });

  describe('#remove()', () => {
    it('makes item not retrievable with #get()', function() {
      const item = makeItem('X');
      this.store.add(item);
      expect(this.store.get('X')).toBe(item);

      this.store.remove(item);
      expect(this.store.get('X')).toBe(undefined);
    });

    it('emits new items value', function() {
      const item1 = makeItem('1');
      const item2 = makeItem('2');
      this.store.reset([item1, item2]);
      this.store.remove(item1);

      expect(this.itemValues).toEqual([[item2], [item1, item2], []]);
    });
  });

  describe('#reset()', () => {
    it('adds new items', function() {
      const item1 = makeItem('1');
      const item2 = makeItem('2');
      this.store.reset([item1, item2]);

      expect(this.itemValues[0]).toEqual([item1, item2]);
      expect(this.store.get('1')).toBe(item1);
      expect(this.store.get('2')).toBe(item2);
    });

    it('evicts old items', function() {
      const old = makeItem('old');
      this.store.add(old);
      expect(this.store.get('old')).toBe(old);

      this.store.reset([makeItem('new')]);
      expect(this.store.get('old')).toBe(undefined);
    });
  });

  function makeItem(id) {
    return {
      id: id,
      getId: _.constant(id)
    };
  }
});
