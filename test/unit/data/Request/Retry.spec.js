'use strict';

describe('data/Request/Retry', function () {
  beforeEach(function () {
    module('contentful/test');

    const wrap = this.$inject('data/Request/Retry').default;
    this.$timeout = this.$inject('$timeout');
    this.$q = this.$inject('$q');

    this.requestStub = sinon.stub();
    const wrapped = wrap(this.requestStub);

    this.push = function (n) {
      if (n) {
        return _.map(_.range(n)).forEach(function (i) {
          return wrapped({i: i});
        });
      } else {
        return wrapped({});
      }
    };

    this.flush = function (t) {
      this.$timeout.flush(t);
    };

    this.expectCallCount = function (n) {
      expect(this.requestStub.callCount).toBe(n);
    };
  });

  pit('executes a request', function () {
    const promise = this.push();
    const res = {};
    this.requestStub.resolves(res);
    this.flush();

    return promise.then(function (requestRes) {
      expect(requestRes).toBe(res);
    });
  });

  it('consumes the queue with a specific rate (7)', function () {
    this.requestStub.resolves({});
    this.push(15);

    this.flush();
    this.expectCallCount(7);
    this.flush();
    this.expectCallCount(14);
    this.flush();
    this.expectCallCount(15);
  });

  it('waits for the end of period (1000) to free a slot', function () {
    this.requestStub.resolves({});
    this.push(15);
    this.flush(10);

    this.flush(900);
    this.expectCallCount(7);
    this.flush(50);
    this.expectCallCount(7);
    this.flush(60);
    this.expectCallCount(14);
    this.flush(1000);
    this.expectCallCount(15);
  });

  pit('retries with an exponential backoff for 429', function () {
    this.requestStub.rejects({statusCode: 429});
    const promise = this.push();
    const res = {};

    this.flush(10);
    this.expectCallCount(1);

    // wait shorter than the first backoff (2000ms)
    this.flush(1010);
    this.flush(1900);
    this.expectCallCount(1);

    this.flush(110);
    this.expectCallCount(2);

    // wait shorter than the second backoff (4000ms)
    this.flush(1010);
    this.flush(3900);
    this.expectCallCount(2);

    this.requestStub.resolves(res);
    this.flush(110);
    this.expectCallCount(3);

    return promise.then(function (requestRes) {
      expect(requestRes).toBe(res);
    });
  });

  it('retries 5 times for 502', function () {
    this.requestStub.rejects({statusCode: 502});
    this.push();

    this.flush(10);
    this.expectCallCount(1);

    this.flush(1000);
    this.expectCallCount(2);

    this.flush(9000);
    this.expectCallCount(6);
  });

  pit('resolves when the request is eventually successful', function () {
    this.requestStub.rejects({statusCode: 502});
    const promise = this.push();
    const res = {};

    this.flush(10);
    this.requestStub.resolves(res);
    this.flush(1000);

    return promise.then(function (requestRes) {
      expect(requestRes).toBe(res);
    });
  });
  pit('rejects when all retries fail', function () {
    const onSuccess = sinon.stub();
    const onError = sinon.stub();

    this.requestStub.rejects({statusCode: 502});
    const promise = this.push();

    this.flush(9000);

    return promise.then(onSuccess, onError).then(function () {
      sinon.assert.notCalled(onSuccess);
      sinon.assert.calledOnce(onError);
    });

  });
});
