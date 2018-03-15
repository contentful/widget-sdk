import * as sinon from 'helpers/sinon';

describe('Segment service', function () {
  beforeEach(function () {
    module('contentful/test');

    this.segment = this.$inject('analytics/segment');
    this.window = this.$inject('$window');
    this.loader = this.$inject('LazyLoader');

    this.analytics = {
      track: sinon.stub(),
      page: sinon.stub(),
      identify: sinon.stub(),
      user: sinon.stub().returns({traits: sinon.stub()})
    };

    const resolve = this.$inject('$q').resolve;
    sinon.stub(this.loader, 'get').callsFake(() => {
      return resolve(this.window.analytics = this.analytics);
    });
  });

  afterEach(function () {
    delete this.window.analytics;
  });

  describe('enable()', function () {
    it('enables the service', function () {
      this.segment.enable();
      sinon.assert.calledOnce(this.loader.get.withArgs('segment'));
      expect(this.window.analytics).not.toBeUndefined();
    });
  });

  describe('disable()', function () {
    it('disables the service', function () {
      this.segment.disable();
      expect(this.window.analytics).toBeUndefined();
    });

    it('ignores subsequent enable() calls', function () {
      this.segment.disable();
      this.segment.enable();
      expect(this.window.analytics).toBeUndefined();
    });
  });

  describeCall('track', {Intercom: false});
  describeCall('page');
  describeCall('identify');

  function describeCall (fnName, integrations) {
    const expectedArgs = ['key', {data: 1}];
    if (integrations) {
      expectedArgs.push({integrations});
    }

    describe(`${fnName} method`, function () {
      beforeEach(function () {
        this.enable = () => {
          this.segment.enable();
          this.$apply(); // resolve lazy loader
        };

        this.assertMethodCalled = () => {
          sinon.assert.calledOnce(this.analytics[fnName]);
          expect(this.analytics[fnName].firstCall.args).toEqual(expectedArgs);
        };
      });

      it('buffers calls until service gets enabled', function () {
        this.segment[fnName]('key', {data: 1});
        this.enable();
        this.assertMethodCalled();
      });

      it('invokes calls immediately if service is enabled', function () {
        this.enable();
        this.segment[fnName]('key', {data: 1});
        this.assertMethodCalled();
      });

      it('ignores calls on a disabled service', function () {
        this.enable();
        this.segment.disable();
        this.segment[fnName]();
        sinon.assert.notCalled(this.analytics[fnName]);
      });

      it('logs an error if segment function throws an exception', function () {
        const spy = this.$inject('logger').logError = sinon.spy();
        const err = new Error('Some exception');

        this.enable();
        this.analytics[fnName].throws(err);
        this.segment[fnName]('key', {data: 1});

        sinon.assert.calledOnce(spy);
        expect(spy.firstCall.args).toEqual(['Failed Segment call', {
          err: err,
          msg: err.message,
          analyticsFn: fnName,
          analyticsFnArgs: expectedArgs
        }]);
      });
    });
  }
});
