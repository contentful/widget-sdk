'use strict';

import * as Paginator from './Paginator.es6';

describe('classes/Paginator.es6', () => {
  let paginator;

  beforeEach(function() {
    paginator = Paginator.create();
  });

  describe('#next/#prev', () => {
    it('increments/decrements page counter', function() {
      paginator.next();
      paginator.next();
      expect(paginator.getPage()).toBe(2);
      paginator.prev();
      expect(paginator.getPage()).toBe(1);
      paginator.setPage(123);
      paginator.next();
      paginator.prev();
      expect(paginator.getPage()).toBe(123);
    });
  });

  describe('#getPerPage', () => {
    it('defaults to 40', function() {
      expect(paginator.getPerPage()).toBe(40);
    });

    it('can be overridden with constructor', function() {
      const p = Paginator.create(123);
      expect(p.getPerPage()).toBe(123);
    });
  });

  describe('#getSkipParam', () => {
    it('returns number of items to skip in query', function() {
      expect(paginator.getSkipParam()).toBe(0);
      paginator.setPage(5);
      expect(paginator.getSkipParam()).toBe(200);
    });

    it('handles non-standard page length', function() {
      const p = Paginator.create(10);
      expect(p.getSkipParam()).toBe(0);
      p.next();
      expect(p.getSkipParam()).toBe(10);
    });
  });

  describe('#getPageCount', () => {
    it('defaults to 0', function() {
      expect(paginator.getPageCount()).toBe(0);
    });

    it('calculates number of pages', function() {
      paginator.setTotal(10);
      expect(paginator.getPageCount()).toBe(1);
      paginator.setTotal(40);
      expect(paginator.getPageCount()).toBe(1);
      paginator.setTotal(50);
      expect(paginator.getPageCount()).toBe(2);
      paginator.setTotal(170);
      expect(paginator.getPageCount()).toBe(5);
    });

    it('handles non-standard page length', function() {
      const p = Paginator.create(13);
      p.setTotal(13);
      expect(p.getPageCount()).toBe(1);
      p.setTotal(30);
      expect(p.getPageCount()).toBe(3);
    });
  });

  describe('#isAtFirst', () => {
    it('returns true when no of page is 0', function() {
      expect(paginator.isAtLast()).toBe(true);
    });

    it('returns true iff on the first page', function() {
      paginator.setPage(0);
      paginator.setTotal(10);

      expect(paginator.isAtFirst()).toBe(true);

      paginator.setPage(5);
      expect(paginator.isAtFirst()).toBe(false);
    });
  });

  describe('#isAtLast', () => {
    it('returns true by default', function() {
      expect(paginator.isAtLast()).toBe(true);
    });

    it('returns true when on the last page or past the last page', function() {
      paginator.setTotal(50);
      expect(paginator.isAtLast()).toBe(false);
      testLastAndNext(paginator);
    });

    it('handles non-standard page length', function() {
      const p = Paginator.create(13);
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
        expect(paginator[getter]()).toBe(0);
      });

      it('sets positive numeric value', function() {
        paginator[setter](123);
        expect(paginator[getter]()).toBe(123);

        paginator[setter](-1);
        expect(paginator[getter]()).toBe(123);
      });

      it('sets positive value with function', function() {
        const val = 123;

        paginator[setter](val);

        // this should not cause page/total to updated
        paginator[setter](currVal => {
          expect(currVal).toBe(val);
          return -currVal;
        });
        expect(paginator[getter]()).toBe(val);

        paginator[setter](_ => 0);
        expect(paginator[getter]()).toBe(0);
      });
    });
  }
});
