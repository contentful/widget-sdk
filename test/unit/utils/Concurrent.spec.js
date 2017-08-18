import {range} from 'lodash';
import * as sinon from 'helpers/sinon';
import * as C from 'utils/Concurrent';
import $q from '$q';

describe('utils/Concurrent', function () {
  beforeEach(function () {
    module('contentful/test');
  });

  describe('.createSlot()', function () {
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

  describe('.createQueue()', function () {
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
});
