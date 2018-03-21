import { createBreadcrumbsHistory } from 'navigation/Breadcrumbs/History';
import * as K from 'utils/kefir';

describe('navigation/Breadcrumbs/History', function () {
  const e = id => { return {id: id}; };

  beforeEach(function () {
    this.ctx = createBreadcrumbsHistory();
    this.assertCrumbCount = count => expect(K.getValue(this.ctx.crumbs$).length).toBe(count);
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
      this.assertCrumbCount(1);
    });

    it('does not add when not empty and w/o addToContext flag', function () {
      this.ctx.add(e(1));
      this.ctx.add(e(1));
      expect(this.ctx.getLast().id).toBe(1);
    });

    it('adds when not empty but with addToContext flag', function () {
      this.ctx.add(e(1));
      this.ctx.add(e(2));
      this.assertCrumbCount(2);
    });

    it('if adding already added entity, it is used as a new head', function () {
      [e(1), e(2), e(3), e(4)].forEach(this.ctx.add);
      this.assertCrumbCount(4);
      this.ctx.add(e(3));
      this.assertCrumbCount(3);
      expect(this.ctx.getLast().id).toBe(3);
    });
  });

  describe('getters', function () {
    beforeEach(function () {
      [e(1), e(2), e(3)].forEach(this.ctx.add);
    });

    it('crumbs$ property', function () {
      this.assertCrumbCount(3);
      const crumbs = K.getValue(this.ctx.crumbs$);
      expect(crumbs[0].id).toBe(1);
      expect(crumbs[1].id).toBe(2);
      expect(crumbs[2].id).toBe(3);
    });

    it('#getLast', function () {
      expect(this.ctx.getLast().id).toBe(3);
    });
  });

  describe('destructive operations', function () {
    beforeEach(function () {
      [e(1), e(2), e(3)].forEach(this.ctx.add);
    });

    it('#pop', function () {
      this.assertCrumbCount(3);
      this.ctx.pop();
      this.assertCrumbCount(2);
    });

    it('#purge', function () {
      this.assertCrumbCount(3);
      this.ctx.purge();
      this.assertCrumbCount(0);
      expect(this.ctx.isEmpty()).toBe(true);
    });
  });
});
