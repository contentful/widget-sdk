describe('ListViewPersistor', function () {
  let TheStore, $location, qs;
  const key = 'lastFilterQueryString.testEntity.SPACE_ID';

  beforeEach(function () {
    module('contentful/test');

    const createPersistor = this.$inject('data/ListViewPersistor').default;
    TheStore = this.$inject('TheStore');
    $location = this.$inject('$location');

    const space = { getId: sinon.stub().returns('SPACE_ID') };

    qs = createPersistor(space, null, 'testEntity');
    sinon.stub($location, 'search');
  });

  describe('#read', function () {
    it('reads data from query string by default', function* () {
      $location.search.returns({ fromSearch: true });
      expect((yield qs.read()).fromSearch).toBe(true);
    });

    it('falls back to data from localStorage', function* () {
      TheStore.set(key, {test: true});
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

    describe('does `searchTerm` migration', function () {
      beforeEach(function () {
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

  describe('#save', function () {
    it('updates query string', function () {
      qs.save({ test: true });
      sinon.assert.calledWith($location.search, 'test=true');
    });

    it('removes "title" field from view settings', function () {
      qs.save({ title: 'New Title', test: true });
      sinon.assert.calledWith($location.search, 'test=true');
    });

    it('removes empty/null/undefined fields from view settings', function () {
      qs.save({ empty: '', n: null, u: undefined, test: true });
      sinon.assert.calledWith($location.search, 'test=true');
    });

    it('use dot notation for nested fields', function () {
      qs.save({ x: { y: 3 } });
      sinon.assert.calledWith($location.search, 'x.y=3');
    });

    it('use pushState to replace URL', function () {
      sinon.stub($location, 'replace');
      qs.save({ test: true });
      sinon.assert.called($location.replace);
    });

    it('puts last QS into the store', function () {
      qs.save({ test: true });
      expect(TheStore.get(key)).toEqual({test: true});
    });
  });
});
