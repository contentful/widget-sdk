describe('utils/Concurrent/MVar.es6', function() {
  beforeEach(function() {
    module('contentful/test');

    this.C = this.$inject('utils/Concurrent.es6');
  });

  function testCreateMVar(name) {
    describe(name, function() {
      describe('#take()', () => {
        it('resolves immediately and empties state when MVar has value', function*() {
          const mVar = this.C[name]('foo');
          expect(mVar.isEmpty()).toEqual(false);
          const value = yield mVar.take();
          expect(value).toEqual('foo');
          expect(mVar.isEmpty()).toEqual(true);
        });

        it('resolves and empties state after value is set on empty MVar', function*() {
          const mVar = this.C[name]();
          expect(mVar.isEmpty()).toEqual(true);
          const takePromise = mVar.take();
          mVar.put('foo');
          expect(yield takePromise).toEqual('foo');
          expect(mVar.isEmpty()).toEqual(true);
        });
      });

      describe('#read()', () => {
        it('resolves immediately and keeps value when MVar has value', function*() {
          const mVar = this.C[name]('foo');
          expect(mVar.isEmpty()).toEqual(false);
          let value = yield mVar.read();
          expect(value).toEqual('foo');
          expect(mVar.isEmpty()).toEqual(false);
          value = yield mVar.read();
          expect(value).toEqual('foo');
        });

        it('resolves and keeps value after value is set on empty MVar', function*() {
          const mVar = this.C[name]();
          expect(mVar.isEmpty()).toEqual(true);
          const readPromise = mVar.read();
          mVar.put('foo');
          expect(yield readPromise).toEqual('foo');
          expect(mVar.isEmpty()).toEqual(false);
          expect(yield mVar.read()).toEqual('foo');
        });
      });

      it('puts value into full MVar', function*() {
        const mVar = this.C[name]();
        mVar.put('foo');
        expect(yield mVar.read()).toEqual('foo');
        mVar.put('bar');
        expect(yield mVar.read()).toEqual('bar');
      });

      it('can have null and undefined as a value', function() {
        let mVar = this.C[name](null);
        expect(mVar.isEmpty()).toEqual(false);
        mVar = this.C[name](undefined);
        expect(mVar.isEmpty()).toEqual(false);
      });

      it('sets to empty synchronously with empty()', function() {
        const mVar = this.C[name]('foo');
        mVar.empty();
        expect(mVar.isEmpty()).toEqual(true);
      });

      it('empty() is a no-op if empty', function*() {
        // This checks that we don’t throw the promise returned by
        // `read()` away when we call `empty()`.
        const mVar = this.C[name]();
        const readPromise = mVar.read();
        mVar.empty();
        mVar.empty();
        mVar.put();
        yield readPromise;
      });
    });
  }

  testCreateMVar('createMVar');
  testCreateMVar('createMVar$q');
});
