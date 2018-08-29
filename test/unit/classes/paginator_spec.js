'use strict';

describe('Paginator', () => {
  beforeEach(function() {
    module('contentful/test');
    this.create = this.$inject('Paginator').create;
    this.p = this.create();
  });

  describe('#next/#prev', () => {
    it('increments/decrements page counter', function() {
      this.p.next();
      this.p.next();
      expect(this.p.getPage()).toBe(2);
      this.p.prev();
      expect(this.p.getPage()).toBe(1);
      this.p.setPage(123);
      this.p.next();
      this.p.prev();
      expect(this.p.getPage()).toBe(123);
    });
  });

  describe('#getPerPage', () => {
    it('defaults to 40', function() {
      expect(this.p.getPerPage()).toBe(40);
    });

    it('can be overridden with constructor', function() {
      const p = this.create(123);
      expect(p.getPerPage()).toBe(123);
    });
  });

  describe('#getSkipParam', () => {
    it('returns number of items to skip in query', function() {
      expect(this.p.getSkipParam()).toBe(0);
      this.p.setPage(5);
      expect(this.p.getSkipParam()).toBe(200);
    });

    it('handles non-standard page length', function() {
      const p = this.create(10);
      expect(p.getSkipParam()).toBe(0);
      p.next();
      expect(p.getSkipParam()).toBe(10);
    });
  });

  describe('#getPageCount', () => {
    it('defaults to 0', function() {
      expect(this.p.getPageCount()).toBe(0);
    });

    it('calculates number of pages', function() {
      this.p.setTotal(10);
      expect(this.p.getPageCount()).toBe(1);
      this.p.setTotal(40);
      expect(this.p.getPageCount()).toBe(1);
      this.p.setTotal(50);
      expect(this.p.getPageCount()).toBe(2);
      this.p.setTotal(170);
      expect(this.p.getPageCount()).toBe(5);
    });

    it('handles non-standard page length', function() {
      const p = this.create(13);
      p.setTotal(13);
      expect(p.getPageCount()).toBe(1);
      p.setTotal(30);
      expect(p.getPageCount()).toBe(3);
    });
  });

  describe('#isAtFirst', () => {
    it('returns true when no of page is 0', function() {
      expect(this.p.isAtLast()).toBe(true);
    });

    it('returns true iff on the first page', function() {
      this.p.setPage(0);
      this.p.setTotal(10);

      expect(this.p.isAtFirst()).toBe(true);

      this.p.setPage(5);
      expect(this.p.isAtFirst()).toBe(false);
    });
  });

  describe('#isAtLast', () => {
    it('returns true by default', function() {
      expect(this.p.isAtLast()).toBe(true);
    });

    it('returns true when on the last page or past the last page', function() {
      this.p.setTotal(50);
      expect(this.p.isAtLast()).toBe(false);
      testLastAndNext(this.p);
    });

    it('handles non-standard page length', function() {
      const p = this.create(13);
      p.setTotal(26);
      expect(p.isAtLast()).toBe(false);
      testLastAndNext(p);
    });

    function testLastAndNext(paginator) {
      paginator.next();
      expect(paginator.isAtLast()).toBe(true);
      paginator.next();
      expect(paginator.isAtLast()).toBe(true);
    }
  });

  testCounter('total');
  testCounter('page');

  function testCounter(name) {
    name = name.slice(0, 1).toUpperCase() + name.slice(1);
    const getter = 'get' + name;
    const setter = 'set' + name;

    describe(`#${name} getter/setter`, () => {
      it('is initialized with 0', function() {
        expect(this.p[getter]()).toBe(0);
      });

      it('sets positive numeric value', function() {
        this.p[setter](123);
        expect(this.p[getter]()).toBe(123);

        this.p[setter](-1);
        expect(this.p[getter]()).toBe(123);
      });

      it('sets positive value with function', function() {
        const val = 123;

        this.p[setter](val);

        // this should not cause page/total to updated
        this.p[setter](currVal => {
          expect(currVal).toBe(val);
          return -currVal;
        });
        expect(this.p[getter]()).toBe(val);

        this.p[setter](_ => 0);
        expect(this.p[getter]()).toBe(0);
      });
    });
  }
});
