'use strict';

describe('dialogsInitController', function () {
  var $rootScope;
  var initEmailSpy, initOnboardingSpy, initTrialSpy;

  afterEach(function () {
    $rootScope = initEmailSpy =
      initOnboardingSpy = initTrialSpy = null;
  });

  beforeEach(function () {
    initEmailSpy = sinon.spy();
    initOnboardingSpy = sinon.spy();
    initTrialSpy = sinon.spy();

    module('contentful/test', function ($provide) {
      $provide.value('onboardingController', {
        init: initOnboardingSpy
      });
      $provide.value('activationEmailResendController', {
        init: initEmailSpy
      });
      $provide.value('TrialWatcher', {
        init: initTrialSpy
      });
    });

    $rootScope = this.$inject('$rootScope');

    var controller = this.$inject('dialogsInitController');
    controller.init();
    $rootScope.$apply();
  });

  describe('init()', function () {
    it('initializes `onboardingController`', function () {
      sinon.assert.calledOnce(initOnboardingSpy);
    });

    it('initializes `TrialWatcher`', function () {
      sinon.assert.calledOnce(initTrialSpy);
    });

    it('does not immediately initialize `activationEmailResendController`', function () {
      sinon.assert.notCalled(initEmailSpy);
    });

    describe('onboarding got shown', function () {
      beforeEach(function () {
        $rootScope.$broadcast('cfAfterOnboarding');
      });

      it('initializes `activationEmailResendController` but skips dialog', function () {
        sinon.assert.calledWith(initEmailSpy, { skipOnce: true });
      });
    });

    describe('onboarding didn\'t get shown', function () {
      beforeEach(function () {
        $rootScope.$broadcast('cfOmitOnboarding');
      });

      it('initializes `activationEmailResendController`', function () {
        sinon.assert.calledWithExactly(initEmailSpy);
      });
    });
  });

});
