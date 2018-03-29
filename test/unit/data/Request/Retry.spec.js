'use strict';
import * as sinon from 'helpers/sinon';

describe('data/Request/Retry', function () {
  beforeEach(function () {
    module('contentful/test');

    this.sandbox = sinon.sandbox.create();

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

  afterEach(function () {
    this.sandbox.restore();
  });

  it('executes a request', function () {
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

  it('consumes queue at rate of 7 requests per second', function () {
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

  it('retries with an exponential backoff for 429', function* () {
    // We wait maximum number of times
    this.sandbox.stub(Math, 'random').returns(1);

    this.requestStub.rejects({status: 429});
    const requestPromise = this.push();

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

    const res = {};
    this.requestStub.resolves(res);
    this.flush(110);
    this.expectCallCount(3);

    const requestRes = yield requestPromise;
    expect(requestRes).toBe(res);
  });

  it('fails after 6 tries for 429', function* () {
    this.requestStub.rejects({status: 429});
    const responsePromise = this.push();

    // This is the formula for the sum of exponentially increasing
    // waiting periods.
    this.flush((Math.pow(2, 7) + 1) * 1000);
    this.expectCallCount(6);
    const response = yield responsePromise.catch(_.identity);
    expect(response.status).toBe(429);
  });

  it('retries 5 times for 502', function () {
    this.requestStub.rejects({status: 502});
    this.push();

    this.flush(10);
    this.expectCallCount(1);

    this.flush(1000);
    this.expectCallCount(2);

    this.flush(9000);
    this.expectCallCount(6);
  });

  it('resolves when the request is eventually successful', function () {
    this.requestStub.rejects({status: 502});
    const promise = this.push();
    const res = {};

    this.flush(10);
    this.requestStub.resolves(res);
    this.flush(1000);

    return promise.then(function (requestRes) {
      expect(requestRes).toBe(res);
    });
  });

  it('rejects when all retries fail', function () {
    const onSuccess = sinon.stub();
    const onError = sinon.stub();

    this.requestStub.rejects({status: 502});
    const promise = this.push();

    this.flush(9000);

    return promise.then(onSuccess, onError).then(function () {
      sinon.assert.notCalled(onSuccess);
      sinon.assert.calledOnce(onError);
    });
  });
});
