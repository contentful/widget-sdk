import { createMVar } from 'utils/Concurrent';

describe('utils/Concurrent/MVar', function() {
  describe('createMVar', function() {
    describe('#take()', () => {
      it('resolves immediately and empties state when MVar has value', async function() {
        const mVar = createMVar('foo');
        expect(mVar.isEmpty()).toEqual(false);
        const value = await mVar.take();
        expect(value).toEqual('foo');
        expect(mVar.isEmpty()).toEqual(true);
      });

      it('resolves and empties state after value is set on empty MVar', async function() {
        const mVar = createMVar();
        expect(mVar.isEmpty()).toEqual(true);
        const takePromise = mVar.take();
        mVar.put('foo');
        expect(await takePromise).toEqual('foo');
        expect(mVar.isEmpty()).toEqual(true);
      });
    });

    describe('#read()', () => {
      it('resolves immediately and keeps value when MVar has value', async function() {
        const mVar = createMVar('foo');
        expect(mVar.isEmpty()).toEqual(false);
        let value = await mVar.read();
        expect(value).toEqual('foo');
        expect(mVar.isEmpty()).toEqual(false);
        value = await mVar.read();
        expect(value).toEqual('foo');
      });

      it('resolves and keeps value after value is set on empty MVar', async function() {
        const mVar = createMVar();
        expect(mVar.isEmpty()).toEqual(true);
        const readPromise = mVar.read();
        mVar.put('foo');
        expect(await readPromise).toEqual('foo');
        expect(mVar.isEmpty()).toEqual(false);
        expect(await mVar.read()).toEqual('foo');
      });
    });

    it('puts value into full MVar', async function() {
      const mVar = createMVar();
      mVar.put('foo');
      expect(await mVar.read()).toEqual('foo');
      mVar.put('bar');
      expect(await mVar.read()).toEqual('bar');
    });

    it('can have null and undefined as a value', function() {
      let mVar = createMVar(null);
      expect(mVar.isEmpty()).toEqual(false);
      mVar = createMVar(undefined);
      expect(mVar.isEmpty()).toEqual(false);
    });

    it('sets to empty synchronously with empty()', function() {
      const mVar = createMVar('foo');
      mVar.empty();
      expect(mVar.isEmpty()).toEqual(true);
    });

    it('empty() is a no-op if empty', async function() {
      // This checks that we don’t throw the promise returned by
      // `read()` away when we call `empty()`.
      const mVar = createMVar();
      const readPromise = mVar.read();
      mVar.empty();
      mVar.empty();
      mVar.put();
      await readPromise;
    });
  });
});
