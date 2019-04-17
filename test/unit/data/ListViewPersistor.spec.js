describe('ListViewPersistor', () => {
  let store, $location, qs;
  afterEach(() => {
    store = $location = qs = null;
  });

  const STORE_KEY = 'lastFilterQueryString.entries.SPACE_ID';

  beforeEach(function() {
    module('contentful/test');

    store = this.$inject('TheStore').getStore();

    $location = this.$inject('$location');
    sinon.stub($location, 'search');

    qs = this.$inject('data/ListViewPersistor.es6').default({
      spaceId: 'SPACE_ID',
      entityType: 'Entry',
      $location
    });
  });

  describe('#read', () => {
    it('reads data from query string by default', () => {
      $location.search.returns({ fromSearch: true });
      expect(qs.read().fromSearch).toBe(true);
    });

    it('falls back to data from localStorage', () => {
      store.set(STORE_KEY, { test: true });
      expect(qs.read().test).toBe(true);
    });

    it('restores nested structure', () => {
      $location.search.returns({ 'x.y': true });
      expect(qs.read().x.y).toBe(true);
    });

    it('handles boolean fields', () => {
      $location.search.returns({ contentTypeHidden: 'false' });
      expect(qs.read().contentTypeHidden).toBe(false);
    });
  });

  describe('#save', () => {
    it('updates query string', () => {
      qs.save({ test: true });
      sinon.assert.calledWith($location.search, 'test=true');
    });

    it('removes "title" field from view settings', () => {
      qs.save({ title: 'New Title', test: true });
      sinon.assert.calledWith($location.search, 'test=true');
    });

    it('removes empty/null/undefined fields from view settings', () => {
      qs.save({ empty: '', n: null, u: undefined, test: true });
      sinon.assert.calledWith($location.search, 'test=true');
    });

    it('use dot notation for nested fields', () => {
      qs.save({ x: { y: 3 } });
      sinon.assert.calledWith($location.search, 'x.y=3');
    });

    it('use pushState to replace URL', () => {
      sinon.stub($location, 'replace');
      qs.save({ test: true });
      sinon.assert.called($location.replace);
    });

    it('puts last QS into the store', () => {
      qs.save({ test: true });
      expect(store.get(STORE_KEY)).toEqual({ test: true });
    });
  });
});
