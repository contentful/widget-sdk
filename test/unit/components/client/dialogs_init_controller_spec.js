'use strict';

describe('dialogsInitController', function () {

  beforeEach(function () {
    this.spaceContext = { getId: sinon.stub() };
    this.OrganizationList = { isEmpty: sinon.stub() };
    this.initEmailSpy = sinon.spy();
    this.initOnboardingSpy = sinon.spy();
    this.trialWatcherNotify = sinon.spy();
    this.billingNotifierNotify = sinon.spy();

    module('contentful/test', ($provide) => {
      $provide.value('spaceContext', this.spaceContext);
      $provide.value('OrganizationList', this.OrganizationList);
      $provide.value('onboardingController', {
        init: this.initOnboardingSpy
      });
      $provide.value('activationEmailResendController', {
        init: this.initEmailSpy
      });
      $provide.value('TrialWatcher', {
        notifyAbout: this.trialWatcherNotify
      });
      $provide.value('billingNotifier', {
        notifyAbout: this.billingNotifierNotify
      });
    });

    this.$rootScope = this.$inject('$rootScope');

    var controller = this.$inject('dialogsInitController');
    controller.init();
    this.$rootScope.$apply();
  });

  describe('init()', function () {
    it('initializes `onboardingController`', function () {
      sinon.assert.calledOnce(this.initOnboardingSpy);
    });

    it('does not immediately initialize `activationEmailResendController`', function () {
      sinon.assert.notCalled(this.initEmailSpy);
    });

    describe('onboarding got shown', function () {
      beforeEach(function () {
        this.$rootScope.$broadcast('cfAfterOnboarding');
      });

      it('initializes `activationEmailResendController` but skips dialog', function () {
        sinon.assert.calledWith(this.initEmailSpy, { skipOnce: true });
      });
    });

    describe('onboarding didn\'t get shown', function () {
      beforeEach(function () {
        this.$rootScope.$broadcast('cfOmitOnboarding');
      });

      it('initializes `activationEmailResendController`', function () {
        sinon.assert.calledWithExactly(this.initEmailSpy);
      });
    });

    describe('notifier services communication', function () {
      var ORGANIZATION = {};

      beforeEach(function () {
        this.spaceContext.getId.returns('SPACE_ID');
        this.spaceContext.getData =
          sinon.stub().withArgs('organization').returns(ORGANIZATION);
        this.OrganizationList.isEmpty.returns(false);
        this.$apply();
      });

      it('calls `TrialWatcher.notifyAbout()`', function () {
        assertCalledServiceNTimesWith(
          this.trialWatcherNotify, 1, ORGANIZATION);
      });

      it('calls `billingNotifier.notifyAbout()`', function () {
        assertCalledServiceNTimesWith(
          this.billingNotifierNotify, 1, ORGANIZATION);
      });

      it('calls `notifyAbout()` again on switching space', function () {
        this.spaceContext.getId.returns('ANOTHER_SPACE_ID');
        this.$apply();
        assertCalledServiceNTimesWith(
          this.trialWatcherNotify, 2, ORGANIZATION);
      });

      function assertCalledServiceNTimesWith (serviceSpy, timesCalled, arg) {
        expect(serviceSpy.callCount).toBe(timesCalled);
        sinon.assert.calledWithExactly(serviceSpy, arg);
      }
    });
  });

});
