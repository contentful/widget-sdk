describe('ListViewPersistor', () => {
  let store, $location, qs, createPersistor, createViewMigrator;
  const STORE_KEY = 'lastFilterQueryString.testEntity.SPACE_ID';

  beforeEach(function () {
    module('contentful/test');

    const getStore = this.$inject('TheStore').getStore;

    store = getStore();
    createPersistor = this.$inject('data/ListViewPersistor').default;
    createViewMigrator = this.$inject('data/ViewMigrator').default;
    $location = this.$inject('$location');

    qs = createPersistor('SPACE_ID', null, 'testEntity');
    sinon.stub($location, 'search');
  });

  describe('#read', () => {
    it('reads data from query string by default', function* () {
      $location.search.returns({ fromSearch: true });
      expect((yield qs.read()).fromSearch).toBe(true);
    });

    it('falls back to data from localStorage', function* () {
      store.set(STORE_KEY, {test: true});
      expect((yield qs.read()).test).toBe(true);
    });

    it('restores nested structure', function* () {
      $location.search.returns({ 'x.y': true });
      expect((yield qs.read()).x.y).toBe(true);
    });

    it('handles boolean fields', function* () {
      $location.search.returns({ contentTypeHidden: 'false' });
      expect((yield qs.read()).contentTypeHidden).toBe(false);
    });

    describe('does `searchTerm` migration', () => {
      beforeEach(() => {
        const space = { getId: sinon.stub().returns('SPACE_ID') };
        const contentTypes = { get: sinon.stub() };
        const viewMigrator = createViewMigrator(space, contentTypes);
        qs = createPersistor('SPACE_ID', viewMigrator, 'testEntity');
        $location.search.returns({ searchTerm: 'some text' });
      });

      it('removes `searchTerm`', function* () {
        expect((yield qs.read()).searchTerm).toBe(undefined);
      });

      it('adds `searchText`', function* () {
        expect((yield qs.read()).searchText).toBe('some text');
      });

      it('adds (empty) `searchFilters`', function* () {
        expect((yield qs.read()).searchFilters).toEqual([]);
      });
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
      expect(store.get(STORE_KEY)).toEqual({test: true});
    });
  });
});
