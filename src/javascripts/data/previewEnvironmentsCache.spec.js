import previewEnvironmentsCache from './previewEnvironmentsCache.es6';

describe('data/previewEnvironmentsCache', () => {
  beforeEach(function() {
    previewEnvironmentsCache.setAll({ foo: makeEnv('foo') });
  });

  function makeEnv(id) {
    return { sys: { id: id } };
  }

  describe('#getAll()', () => {
    it('fetches all', function() {
      expect(previewEnvironmentsCache.getAll()).toEqual({ foo: makeEnv('foo') });
    });
  });

  describe('#setAll', () => {
    it('replaces cached object', function() {
      const newObj = { test: 'new' };
      previewEnvironmentsCache.setAll(newObj);
      expect(previewEnvironmentsCache.getAll()).toBe(newObj);
    });
  });

  describe('#set', () => {
    let env;
    let response;

    beforeEach(function() {
      env = makeEnv('bar');
      response = previewEnvironmentsCache.set(env);
    });

    it('returns environment', function() {
      expect(response).toEqual(env);
    });

    it('updates cache', function() {
      const resp = previewEnvironmentsCache.getAll();
      expect(resp.foo).toEqual(makeEnv('foo'));
      expect(resp.bar).toEqual(makeEnv('bar'));
    });
  });

  describe('#clearAll', () => {
    it('sets cache object to undefined', function() {
      previewEnvironmentsCache.clearAll();
      expect(previewEnvironmentsCache.getAll()).toBeUndefined();
    });
  });
});
