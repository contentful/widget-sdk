import { range } from 'lodash';
import sinon from 'sinon';
import { $initialize, $inject, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('utils/Concurrent', () => {
  let C;
  let C$q;

  beforeEach(async function() {
    C = await this.system.import('utils/Concurrent');
    C$q = await this.system.import('utils/ConcurrentQ');

    await $initialize(this.system);

    this.$q = $inject('$q');
  });

  afterEach(() => {
    C = undefined;
    C$q = undefined;
  });

  describe('.createSlot()', () => {
    it('only resolves current promise', async function() {
      const onResult = sinon.spy();
      const put = C.createSlot(onResult);

      const a = this.$q.defer();
      put(a.promise);
      const b = this.$q.defer();
      put(b.promise);
      a.resolve('VAL A');
      b.resolve('VAL B');
      $apply();

      sinon.assert.calledOnceWith(onResult, C.Success('VAL B'));
    });

    it('only rejects current promise', async function() {
      const onResult = sinon.spy();
      const put = C.createSlot(onResult);

      const a = this.$q.defer();
      put(a.promise);
      const b = this.$q.defer();
      put(b.promise);
      a.reject('ERR A');
      b.reject('ERR B');
      $apply();

      sinon.assert.calledOnce(onResult);
      sinon.assert.calledOnceWith(onResult, C.Failure('ERR B'));
    });
  });

  describe('.createQueue()', () => {
    it('works', async function() {
      const calls = [];
      const q = C$q.createQueue();

      // We create a list of runner functions together with the
      // 'deferred' objects they resolve with
      const [a, b, c] = range(4).map(i => {
        const deferred = this.$q.defer();
        return {
          deferred: deferred,
          run: () => {
            calls.push(String.fromCharCode(i + 97));
            return deferred.promise;
          }
        };
      });

      const waitA = q.push(a.run);
      const waitB = q.push(b.run);
      expect(calls).toEqual(['a']);

      a.deferred.resolve('resultA');
      const resultA = await waitA;
      expect(resultA).toBe('resultA');

      expect(calls).toEqual(['a', 'b']);
      const waitC = q.push(c.run);
      expect(calls).toEqual(['a', 'b']);

      b.deferred.resolve('resultB');
      const resultB = await waitB;
      expect(resultB).toBe('resultB');

      expect(calls).toEqual(['a', 'b', 'c']);
      c.deferred.resolve('resultC');
      const resultC = await waitC;
      expect(resultC).toBe('resultC');
    });
  });

  describe('.createExclusiveTask()', () => {
    it('does not run multiple tasks concurrently', async function() {
      let callCount = 0;
      const taskDone = C.createMVar();
      const task = C.createExclusiveTask(async function() {
        callCount++;
        await taskDone.read();
      });

      expect(callCount).toBe(0);
      task.call();
      task.call();
      task.call();
      expect(callCount).toBe(1);

      taskDone.put();
      await task.call();

      taskDone.empty();
      expect(callCount).toBe(1);
      task.call();
      task.call();
      expect(callCount).toBe(2);
    });

    it('resets the task on errors', async function() {
      let callCount = 0;
      const taskDone = C.createMVar();
      const task = C.createExclusiveTask(async function() {
        callCount++;
        await taskDone.read();
        throw new Error();
      });

      expect(callCount).toBe(0);
      const result = task.call().catch(() => null);
      task.call();
      expect(callCount).toBe(1);

      taskDone.put();
      await result;

      taskDone.empty();
      expect(callCount).toBe(1);
      task.call().catch(() => null);
      task.call();
      expect(callCount).toBe(2);
    });

    it('returns the functions results', async function() {
      const taskDone = C.createMVar();
      const task = C.createExclusiveTask(async function() {
        return await taskDone.read();
      });

      const r1 = task.call();
      const r2 = task.call();
      expect(r1).toBe(r2);

      const value = {};
      taskDone.put(value);
      const results = await Promise.all([r1, r2]);
      expect(results[0]).toBe(value);
      expect(results[1]).toBe(value);
    });
  });
});
