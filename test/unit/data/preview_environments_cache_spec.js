'use strict';

describe('data/previewEnvironmentsCache', () => {
  beforeEach(function() {
    module('contentful/test');
    this.previewEnvironmentsCache = this.$inject('data/previewEnvironmentsCache');
    this.previewEnvironmentsCache.setAll({ foo: makeEnv('foo') });
  });

  function makeEnv(id) {
    return { sys: { id: id } };
  }

  describe('#getAll()', () => {
    it('fetches all', function() {
      expect(this.previewEnvironmentsCache.getAll()).toEqual({ foo: makeEnv('foo') });
    });
  });

  describe('#setAll', () => {
    it('replaces cached object', function() {
      const newObj = { test: 'new' };
      this.previewEnvironmentsCache.setAll(newObj);
      expect(this.previewEnvironmentsCache.getAll()).toBe(newObj);
    });
  });

  describe('#set', () => {
    beforeEach(function() {
      this.env = makeEnv('bar');
      this.response = this.previewEnvironmentsCache.set(this.env);
    });
    it('returns environment', function() {
      expect(this.response).toEqual(this.env);
    });

    it('updates cache', function() {
      const resp = this.previewEnvironmentsCache.getAll();
      expect(resp.foo).toEqual(makeEnv('foo'));
      expect(resp.bar).toEqual(makeEnv('bar'));
    });
  });

  describe('#clearAll', () => {
    it('sets cache object to undefined', function() {
      this.previewEnvironmentsCache.clearAll();
      expect(this.previewEnvironmentsCache.getAll()).toBeUndefined();
    });
  });
});
