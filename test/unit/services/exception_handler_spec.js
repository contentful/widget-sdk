'use strict';

// TODO this is disabled until we figured out how to overwrite the
// $esceptionHandler for all the tests except for this one
// (hint: put it in a separate module and load that AFTER the rest of the app)
xdescribe('Exception handler service', function () {
  var $exceptionHandler;
  var exception;
  var exceptionStub, errorStub, triggerStub;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.constant('environment', {
        env: 'production'
      });

      exceptionStub = sinon.stub();
      $provide.factory('logger', function () {
        return {
          logException: exceptionStub,
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

  afterEach(function () {
    errorStub.restore();
  });

  it('$log error called', function () {
    sinon.assert.calledWith(errorStub, exception);
  });

  it('logger logException called', function () {
    sinon.assert.calledWith(exceptionStub, exception);
  });

  it('ReloadNotification triggered', function () {
    sinon.assert.called(triggerStub);
  });


});
