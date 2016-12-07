'use strict';

describe('contextHistory service', function () {
  const e = (id) => { return {id: id}; };

  beforeEach(function () {
    module('contentful/test');
    this.ctx = this.$inject('contextHistory');
    this.ctx.purge();
    this.params = this.$inject('$stateParams');
    this.params.addToContext = false;
  });

  describe('after init (empty state)', function () {
    it('is empty', function () {
      expect(this.ctx.isEmpty()).toBe(true);
    });

    it('pop returns undefined', function () {
      expect(this.ctx.pop()).toBeUndefined();
    });
  });

  describe('adding entities', function () {
    it('adds when empty and w/o addToContext flag', function () {
      this.ctx.add(e(1));
      expect(this.ctx.getAll().length).toBe(1);
    });

    it('does not add when not empty and w/o addToContext flag', function () {
      this.ctx.add(e(1));
      this.ctx.add(e(1));
      expect(this.ctx.getLast().id).toBe(1);
    });

    it('adds when not empty but with addToContext flag', function () {
      this.params.addToContext = true;
      this.ctx.add(e(1));
      this.ctx.add(e(2));
      expect(this.ctx.getAll().length).toBe(2);
    });

    it('if adding already added entity, it is used as a new head', function () {
      this.params.addToContext = true;
      [e(1), e(2), e(3), e(4)].forEach(this.ctx.add);
      expect(this.ctx.getAll().length).toBe(4);
      this.ctx.add(e(3));
      expect(this.ctx.getAll().length).toBe(3);
      expect(this.ctx.getLast().id).toBe(3);
    });
  });

  describe('getters', function () {
    beforeEach(function () {
      this.params.addToContext = true;
      [e(1), e(2), e(3)].forEach(this.ctx.add);
    });

    it('#getAll', function () {
      const all = this.ctx.getAll();
      expect(all.length).toBe(3);
      expect(all[1].id).toBe(2);
    });

    it('#getLast', function () {
      expect(this.ctx.getLast().id).toBe(3);
    });
  });

  describe('destructive operations', function () {
    beforeEach(function () {
      this.params.addToContext = true;
      [e(1), e(2), e(3)].forEach(this.ctx.add);
    });

    it('#pop', function () {
      expect(this.ctx.getAll().length).toBe(3);
      this.ctx.pop();
      expect(this.ctx.getAll().length).toBe(2);
      expect(this.ctx.getLast().id).toBe(2);
    });

    it('#purge', function () {
      expect(this.ctx.getAll().length).toBe(3);
      this.ctx.purge();
      expect(this.ctx.getAll().length).toBe(0);
      expect(this.ctx.isEmpty()).toBe(true);
    });
  });
});
