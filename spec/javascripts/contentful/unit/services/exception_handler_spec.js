'use strict';

describe('Exception handler service', function () {
  var $exceptionHandler;
  var exception;
  var exceptionStub, errorStub, triggerStub;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.constant('environment', {
        env: 'production'
      });

      exceptionStub = sinon.stub();
      $provide.factory('sentry', function () {
        return {
          captureException: exceptionStub
        };
      });

      triggerStub = sinon.stub();
      $provide.value('ReloadNotification', {
        trigger: triggerStub
      });
    });
    inject(function (_$exceptionHandler_, $log) {
      errorStub = sinon.stub($log, 'error');
      $exceptionHandler = _$exceptionHandler_;
      exception = new Error('derp');
      $exceptionHandler(exception);
    });
  });

  afterEach(inject(function ($log) {
    errorStub.restore();
    $log.assertEmpty();
  }));

  it('$log error called', function () {
    expect(errorStub.calledWith(exception)).toBeTruthy();
  });

  it('sentry captureException called', function () {
    expect(exceptionStub.calledWith(exception)).toBeTruthy();
  });

  it('ReloadNotification triggered', function () {
    expect(triggerStub).toBeCalled();
  });


});
