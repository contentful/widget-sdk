'use strict';

// TODO this is disabled until we figured out how to overwrite the
// $esceptionHandler for all the tests except for this one
// (hint: put it in a separate module and load that AFTER the rest of the app)
xdescribe('Exception handler service', () => {
  let $exceptionHandler;
  let exception;
  let exceptionStub, errorStub, triggerStub;

  beforeEach(() => {
    module('contentful/test', $provide => {
      $provide.constant('Config.es6', {
        env: 'production'
      });

      exceptionStub = sinon.stub();
      $provide.factory('logger', () => ({
        logException: exceptionStub
      }));

      triggerStub = sinon.stub();
      $provide.value('app/common/ReloadNotification.es6', {
        trigger: triggerStub
      });
    });
    inject((_$exceptionHandler_, $log) => {
      errorStub = sinon.stub($log, 'error');
      $exceptionHandler = _$exceptionHandler_;
      exception = new Error('derp');
      $exceptionHandler(exception);
    });
  });

  afterEach(() => {
    errorStub.restore();
  });

  it('$log error called', () => {
    sinon.assert.calledWith(errorStub, exception);
  });

  it('logger logException called', () => {
    sinon.assert.calledWith(exceptionStub, exception);
  });

  it('ReloadNotification triggered', () => {
    sinon.assert.called(triggerStub);
  });
});
