import * as K from 'helpers/mocks/kefir';

describe('data/StreamHashSet', function () {
  beforeEach(function () {
    module('contentful/test');
    this.store = this.$inject('data/StreamHashSet').create();

    this.itemValues = K.extractValues(this.store.items$);
  });

  describe('#add()', function () {
    it('makes item retrievable with #get()', function () {
      expect(this.store.get('X')).toBe(undefined);
      const item = makeItem('X');
      this.store.add(item);
      expect(this.store.get('X')).toBe(item);
    });

    it('emits new items value', function () {
      const item1 = makeItem('1');
      this.store.add(item1);

      const item2 = makeItem('2');
      this.store.add(item2);

      expect(this.itemValues).toEqual([
        [item1, item2],
        [item1],
        []
      ]);
    });
  });

  describe('#remove()', function () {
    it('makes item not retrievable with #get()', function () {
      const item = makeItem('X');
      this.store.add(item);
      expect(this.store.get('X')).toBe(item);

      this.store.remove(item);
      expect(this.store.get('X')).toBe(undefined);
    });

    it('emits new items value', function () {
      const item1 = makeItem('1');
      const item2 = makeItem('2');
      this.store.reset([item1, item2]);
      this.store.remove(item1);

      expect(this.itemValues).toEqual([
        [item2],
        [item1, item2],
        []
      ]);
    });
  });

  describe('#reset()', function () {
    it('adds new items', function () {
      const item1 = makeItem('1');
      const item2 = makeItem('2');
      this.store.reset([item1, item2]);

      expect(this.itemValues[0]).toEqual([item1, item2]);
      expect(this.store.get('1')).toBe(item1);
      expect(this.store.get('2')).toBe(item2);
    });

    it('evicts old items', function () {
      const old = makeItem('old');
      this.store.add(old);
      expect(this.store.get('old')).toBe(old);

      this.store.reset([makeItem('new')]);
      expect(this.store.get('old')).toBe(undefined);
    });
  });

  function makeItem (id) {
    return {
      id: id,
      getId: _.constant(id)
    };
  }
});
