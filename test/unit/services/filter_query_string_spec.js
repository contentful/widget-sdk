'use strict';

describe('Filter Query String', function () {
  var FilterQS, TheStore, $location, spaceContext, qs;

  beforeEach(function() {
    module('contentful/test');

    FilterQS = this.$inject('FilterQueryString');
    TheStore = this.$inject('TheStore');
    $location = this.$inject('$location');
    spaceContext = this.$inject('spaceContext');

    qs = FilterQS.create('testEntity');
    sinon.stub($location, 'search');
    sinon.stub(TheStore, 'set');
  });

  describe('initialization', function () {
    it('constructor exposes API', function () {
      expect(typeof qs.update).toBe('function');
      expect(typeof qs.readView).toBe('function');
    });

    describe('"readView" method', function () {
      it('reads data from query string by default', function () {
        $location.search.returns({ fromSearch: true });
        expect(qs.readView().fromSearch).toBe(true);
      });

      it('falls back to data from localStorage', function () {
        sinon.stub(TheStore, 'get').returns({ test: true });
        expect(qs.readView().test).toBe(true);
      });

      it('restores nested structure', function () {
        $location.search.returns({ 'x.y': true });
        expect(qs.readView().x.y).toBe(true);
      });

      it('handles boolean fileds', function () {
        $location.search.returns({ contentTypeHidden: 'false' });
        expect(qs.readView().contentTypeHidden).toBe(false);
      });
    });
  });

  describe('"update" method', function () {
    it('updates query string', function () {
      qs.update({ test: true });
      sinon.assert.calledWith($location.search, 'test=true');
    });

    it('removes "title" field from view settings', function () {
      qs.update({ title: 'New Title', test: true });
      sinon.assert.calledWith($location.search, 'test=true');
    });

    it('removes empty/null/undefined fields from view settings', function () {
      qs.update({ empty: '', n: null, u: undefined, test: true });
      sinon.assert.calledWith($location.search, 'test=true');
    });

    it('use dot notation for nested fields', function () {
      qs.update({ x: { y: 3 }});
      sinon.assert.calledWith($location.search, 'x.y=3');
    });

    it('use pushState to replace URL', function () {
      sinon.stub($location, 'replace');
      qs.update({ test: true });
      sinon.assert.called($location.replace);
    });

    it('puts last QS into the store', function () {
      spaceContext.space = { data: { sys: { id: 123 } } };
      qs.update({ test: true });
      sinon.assert.calledWith(TheStore.set, 'lastFilterQueryString.testEntity.123', { test: true });
    });
  });
});
