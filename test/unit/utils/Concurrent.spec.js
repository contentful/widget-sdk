import {range} from 'lodash';
import * as sinon from 'helpers/sinon';
import * as C from 'utils/Concurrent';
import $q from '$q';

describe('utils/Concurrent', () => {
  beforeEach(() => {
    module('contentful/test');
  });

  describe('.createSlot()', () => {
    it('only resolves current promise', function* () {
      const $q = this.$inject('$q');
      const onResult = sinon.spy();
      const put = C.createSlot(onResult);

      const a = $q.defer();
      put(a.promise);
      const b = $q.defer();
      put(b.promise);
      a.resolve('VAL A');
      b.resolve('VAL B');
      this.$apply();

      sinon.assert.calledOnceWith(onResult, C.Success('VAL B'));
    });

    it('only rejects current promise', function* () {
      const $q = this.$inject('$q');
      const onResult = sinon.spy();
      const put = C.createSlot(onResult);

      const a = $q.defer();
      put(a.promise);
      const b = $q.defer();
      put(b.promise);
      a.reject('ERR A');
      b.reject('ERR B');
      this.$apply();

      sinon.assert.calledOnce(onResult);
      sinon.assert.calledOnceWith(onResult, C.Failure('ERR B'));
    });
  });

  describe('.createQueue()', () => {
    it('works', function* () {
      const calls = [];
      const q = C.createQueue();

      // We create a list of runner functions together with the
      // 'deferred' objects they resolve with
      const [a, b, c] = range(4).map((i) => {
        const deferred = $q.defer();
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
      const resultA = yield waitA;
      expect(resultA).toBe('resultA');

      expect(calls).toEqual(['a', 'b']);
      const waitC = q.push(c.run);
      expect(calls).toEqual(['a', 'b']);

      b.deferred.resolve('resultB');
      const resultB = yield waitB;
      expect(resultB).toBe('resultB');

      expect(calls).toEqual(['a', 'b', 'c']);
      c.deferred.resolve('resultC');
      const resultC = yield waitC;
      expect(resultC).toBe('resultC');
    });
  });

  describe('.createExclusiveTask()', () => {
    it('does not run multiple tasks concurrently', function* () {
      let callCount = 0;
      const taskDone = C.createMVar();
      const task = C.createExclusiveTask(C.wrapTask(function* () {
        callCount++;
        yield taskDone.read();
      }));

      expect(callCount).toBe(0);
      task.call();
      task.call();
      task.call();
      expect(callCount).toBe(1);

      taskDone.put();
      yield task.call();

      taskDone.empty();
      expect(callCount).toBe(1);
      task.call();
      task.call();
      expect(callCount).toBe(2);
    });

    it('resets the task on errors', function* () {
      let callCount = 0;
      const taskDone = C.createMVar();
      const task = C.createExclusiveTask(C.wrapTask(function* () {
        callCount++;
        yield taskDone.read();
        throw new Error();
      }));

      expect(callCount).toBe(0);
      const result = task.call().catch(() => null);
      task.call();
      expect(callCount).toBe(1);

      taskDone.put();
      yield result;

      taskDone.empty();
      expect(callCount).toBe(1);
      task.call().catch(() => null);
      task.call();
      expect(callCount).toBe(2);
    });

    it('returns the functions results', function* () {
      const taskDone = C.createMVar();
      const task = C.createExclusiveTask(C.wrapTask(function* () {
        return yield taskDone.read();
      }));

      const r1 = task.call();
      const r2 = task.call();
      expect(r1).toBe(r2);

      const value = {};
      taskDone.put(value);
      const results = yield Promise.all([r1, r2]);
      expect(results[0]).toBe(value);
      expect(results[1]).toBe(value);
    });
  });
});
