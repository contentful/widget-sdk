'use strict';

describe('Segment service', function () {
  var segment, $window, document, logger;
  var logSpy;

  beforeEach(function () {
    logSpy = sinon.spy();

    module('contentful/test', function ($provide) {
      $provide.value('$document', [{
        createElement: sinon.stub().returns({}),
        location: {protocol: 'https:'},
        getElementsByTagName: sinon.stub().returns([{
          parentNode: {insertBefore: sinon.stub()}
        }])
      }]);
      $provide.value('logger', {
        logError: logSpy
      });
    });
    segment  = this.$inject('segment');
    $window  = this.$inject('$window');
    document = this.$inject('$document')[0];
    logger   = this.$inject('logger');
  });

  afterEach(function () {
    delete $window.analytics;
  });

  describe('enable()', function () {
    it('enables the service', function () {
      segment.enable();
      assertSegmentGotLoaded();
    });
  });

  describe('disable()', function () {
    it('disables the service', function () {
      segment.disable();
      assertSegmentGotNotLoaded();
    });

    it('ignores subsequent enable() calls', function () {
      segment.disable();
      segment.enable();
      assertSegmentGotNotLoaded();
    });

    it('stops if previously enabled', function () {
      segment.enable();
      segment.disable();

    });
  });

  describeSegmentFunction('page');
  describeSegmentFunction('identify');
  describeSegmentFunction('track');

  function describeSegmentFunction ( fnName) {
    describe(fnName + '()', function () {
      beforeEach(function () {
        document.createElement = sinon.spy(function () {
          $window.analytics[fnName] = sinon.stub();
          return {};
        });
      });

      it('buffers calls until service gets enabled', function () {
        segment[fnName]('foo', 1, 2);
        segment.enable();
        sinon.assert.calledWithExactly($window.analytics[fnName], 'foo', 1, 2);
      });

      it('invokes calls immediately if service is enabled', function () {
        segment.enable();
        segment[fnName]('bar', 1, 2);
        sinon.assert.calledWithExactly($window.analytics[fnName], 'bar', 1, 2);
      });

      it('ignores calls on a disabled service', function () {
        segment.disable();
        segment[fnName]('foo');
      });

      it('results in an error being logged if the respective analytics.js function throws an exception', function () {
        segment.enable();
        $window.analytics[fnName].throws();
        segment[fnName]('bar', 1, 2);
        sinon.assert.calledOnce(logSpy);
        sinon.assert.calledWithExactly(logSpy,
          'Failed analytics.js call', sinon.match.object);
        expect(logSpy.args[0][1].data).toEqual(jasmine.objectContaining({
          msg: jasmine.any(String),
          exp: jasmine.any(Error),
          analyticsFn: fnName,
          analyticsFnArgs: ['bar', 1, 2]
        }));
      });
    });
  }

  function assertSegmentGotLoaded () {
    expect(window.analytics).not.toBe(undefined);
  }

  function assertSegmentGotNotLoaded () {
    expect(window.analytics).toBe(undefined);
  }
});
