'use strict';

describe('Segment service', function () {
  beforeEach(function () {
    module('contentful/test');

    this.segment = this.$inject('segment');
    this.win = this.$inject('$window');

    sinon.stub(this.$inject('LazyLoader'), 'get', () => {
      this.win.analytics = {
        track: sinon.stub(),
        page: sinon.stub(),
        identify: sinon.stub()
      };
      return this.$inject('$q').resolve(this.win.analytics);
    });
  });

  afterEach(function () {
    delete this.win.analytics;
  });

  describe('enable()', function () {
    it('enables the service', function () {
      this.segment.enable();
      expect(this.win.analytics).not.toBeUndefined();
    });
  });

  describe('disable()', function () {
    it('disables the service', function () {
      this.segment.disable();
      expect(this.win.analytics).toBeUndefined();
    });

    it('ignores subsequent enable() calls', function () {
      this.segment.disable();
      this.segment.enable();
      expect(this.win.analytics).toBeUndefined();
    });
  });

  describeSegmentFunction('track');
  describeSegmentFunction('page');
  describeSegmentFunction('identify');

  function describeSegmentFunction (fnName) {
    describe(`${fnName} method`, function () {
      it('buffers calls until service gets enabled', function () {
        this.segment[fnName]('foo', 1, 2);
        this.segment.enable(true);
        this.$apply();
        sinon.assert.calledWithExactly(this.win.analytics[fnName], 'foo', 1, 2);
      });

      it('invokes calls immediately if service is enabled', function () {
        this.segment.enable(true);
        this.$apply();
        this.segment[fnName]('bar', 1, 2);
        sinon.assert.calledWithExactly(this.win.analytics[fnName], 'bar', 1, 2);
      });

      it('ignores calls on a disabled service', function () {
        this.segment.enable(true);
        this.$apply();
        this.segment.disable();
        this.segment[fnName]('foo');
        sinon.assert.notCalled(this.win.analytics[fnName]);
      });

      it('results in an error being logged if the respective analytics.js function throws an exception', function () {
        const logSpy = sinon.spy();
        this.$inject('logger').logError = logSpy;

        this.segment.enable(true);
        this.$apply();
        this.win.analytics[fnName].throws();

        this.segment[fnName]('bar', 1, 2);

        sinon.assert.calledOnce(logSpy);
        sinon.assert.calledWithExactly(logSpy, 'Failed analytics.js call', sinon.match.object);
        expect(logSpy.args[0][1].data).toEqual(jasmine.objectContaining({
          msg: jasmine.any(String),
          exp: jasmine.any(Error),
          analyticsFn: fnName,
          analyticsFnArgs: ['bar', 1, 2]
        }));
      });
    });
  }
});
