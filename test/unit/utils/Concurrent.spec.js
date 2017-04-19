import * as sinon from 'helpers/sinon';
import * as C from 'utils/Concurrent';

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

      sinon.assert.calledOnce(onResult);
      sinon.assert.calledWith(onResult, {type: 'success', value: 'VAL B'});
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
      sinon.assert.calledWith(onResult, {type: 'error', error: 'ERR B'});
    });
  });
});
