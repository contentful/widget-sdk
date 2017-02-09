'use strict';

describe('utils/Concurrent/MVar', function () {

  beforeEach(function () {
    module('cf.utils', 'contentful/test');
    this.createMVar = this.$inject('utils/Concurrent/MVar').default;
  });

  describe('#take()', function () {
    it('resolves immediately and empties state when MVar has value', function* () {
      const mVar = this.createMVar('foo');
      expect(mVar.isEmpty()).toEqual(false);
      const value = yield mVar.take();
      expect(value).toEqual('foo');
      expect(mVar.isEmpty()).toEqual(true);
    });

    it('resolves and empties state after value is set on empty MVar', function* () {
      const mVar = this.createMVar();
      expect(mVar.isEmpty()).toEqual(true);
      const takePromise = mVar.take();
      mVar.put('foo');
      expect(yield takePromise).toEqual('foo');
      expect(mVar.isEmpty()).toEqual(true);
    });
  });

  describe('#read()', function () {
    it('resolves immediately and keeps value when MVar has value', function* () {
      const mVar = this.createMVar('foo');
      expect(mVar.isEmpty()).toEqual(false);
      let value = yield mVar.read();
      expect(value).toEqual('foo');
      expect(mVar.isEmpty()).toEqual(false);
      value = yield mVar.read();
      expect(value).toEqual('foo');
    });

    it('resolves and keeps value after value is set on empty MVar', function* () {
      const mVar = this.createMVar();
      expect(mVar.isEmpty()).toEqual(true);
      const readPromise = mVar.read();
      mVar.put('foo');
      expect(yield readPromise).toEqual('foo');
      expect(mVar.isEmpty()).toEqual(false);
      expect(yield mVar.read()).toEqual('foo');
    });
  });

  it('puts value into full MVar', function* () {
    const mVar = this.createMVar();
    mVar.put('foo');
    expect(yield mVar.read()).toEqual('foo');
    mVar.put('bar');
    expect(yield mVar.read()).toEqual('bar');
  });

  it('can have null and undefined as a value', function () {
    let mVar = this.createMVar(null);
    expect(mVar.isEmpty()).toEqual(false);
    mVar = this.createMVar(undefined);
    expect(mVar.isEmpty()).toEqual(false);
  });

  it('sets to empty synchronously with empty()', function () {
    const mVar = this.createMVar('foo');
    mVar.empty();
    expect(mVar.isEmpty()).toEqual(true);
  });

});
