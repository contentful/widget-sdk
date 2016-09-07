'use strict';

describe('Paginator', function () {
  beforeEach(function () {
    module('contentful/test');
    this.create = this.$inject('Paginator').create;
    this.p = this.create();
  });

  describe('#next/#previous', function () {
    it('increments/decrements page counter', function () {
      this.p.next();
      this.p.next();
      expect(this.p.page()).toBe(2);
      this.p.previous();
      expect(this.p.page()).toBe(1);
      this.p.page(123);
      this.p.next();
      this.p.previous();
      expect(this.p.page()).toBe(123);
    });
  });

  describe('#perPage', function () {
    it('defaults to 40', function () {
      expect(this.p.perPage()).toBe(40);
    });

    it('can be overridden with constructor', function () {
      const p = this.create(123);
      expect(p.perPage()).toBe(123);
    });
  });

  describe('#skipParam', function () {
    it('returns number of items to skip in query', function () {
      expect(this.p.skipParam()).toBe(0);
      this.p.page(5);
      expect(this.p.skipParam()).toBe(200);
    });

    it('handles non-standard page length', function () {
      const p = this.create(10);
      expect(p.skipParam()).toBe(0);
      p.next();
      expect(p.skipParam()).toBe(10);
    });
  });

  describe('#pageCount', function () {
    it('defaults to 0', function () {
      expect(this.p.pageCount()).toBe(0);
    });

    it('calculates number of pages', function () {
      this.p.total(10);
      expect(this.p.pageCount()).toBe(1);
      this.p.total(40);
      expect(this.p.pageCount()).toBe(1);
      this.p.total(50);
      expect(this.p.pageCount()).toBe(2);
      this.p.total(170);
      expect(this.p.pageCount()).toBe(5);
    });

    it('handles non-standard page length', function () {
      const p = this.create(13);
      p.total(13);
      expect(p.pageCount()).toBe(1);
      p.total(30);
      expect(p.pageCount()).toBe(3);
    });
  });

  describe('#end', function () {
    it('returns true by default', function () {
      expect(this.p.end()).toBe(true);
    });

    it('returns true when on the last page or past the last page', function () {
      this.p.total(50);
      expect(this.p.end()).toBe(false);
      testLastAndNext(this.p);
    });

    it('handles non-standard page length', function () {
      const p = this.create(13);
      p.total(26);
      expect(p.end()).toBe(false);
      testLastAndNext(p);
    });

    function testLastAndNext (paginator) {
      paginator.next();
      expect(paginator.end()).toBe(true);
      paginator.next();
      expect(paginator.end()).toBe(true);
    }
  });

  testCounter('total');
  testCounter('page');

  function testCounter (method) {
    describe(`#${method} getter/setter`, function () {
      it('is initialized with 0', function () {
        expect(this.p[method]()).toBe(0);
      });

      it('sets numeric value', function () {
        this.p[method](123);
        expect(this.p[method]()).toBe(123);
      });

      it('sets value with function', function () {
        this.p[method](123);
        this.p[method]((total) => {
          expect(total).toBe(123);
          return -total;
        });
        expect(this.p[method]()).toBe(-123);
      });
    });
  }
});
