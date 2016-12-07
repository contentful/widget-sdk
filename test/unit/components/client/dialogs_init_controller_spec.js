'use strict';

describe('dialogsInitController', function () {

  beforeEach(function () {
    this.spaceContext = { getId: sinon.stub() };
    this.OrganizationList = { isEmpty: sinon.stub() };
    this.initEmailSpy = sinon.spy();
    this.initOnboardingSpy = sinon.spy();
    this.subscriptionNotifierNotify = sinon.spy();
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
      $provide.value('subscriptionNotifier', {
        notifyAbout: this.subscriptionNotifierNotify
      });
      $provide.value('billingNotifier', {
        notifyAbout: this.billingNotifierNotify
      });
    });

    this.$rootScope = this.$inject('$rootScope');

    const controller = this.$inject('dialogsInitController');
    controller.init();
    this.$rootScope.$apply();
  });

  describe('init()', function () {
    describe('notifier services communication', function () {
      const ORGANIZATION = {};

      beforeEach(function () {
        this.spaceContext.getId.returns('SPACE_ID');
        this.spaceContext.getData =
          sinon.stub().withArgs('organization').returns(ORGANIZATION);
        this.OrganizationList.isEmpty.returns(false);
        this.$apply();
      });

      it('calls `subscriptionNotifier.notifyAbout()`', function () {
        assertCalledServiceNTimesWith(
          this.subscriptionNotifierNotify, 1, ORGANIZATION);
      });

      it('calls `billingNotifier.notifyAbout()`', function () {
        assertCalledServiceNTimesWith(
          this.billingNotifierNotify, 1, ORGANIZATION);
      });

      it('calls `notifyAbout()` again on switching space', function () {
        this.spaceContext.getId.returns('ANOTHER_SPACE_ID');
        this.$apply();
        assertCalledServiceNTimesWith(
          this.subscriptionNotifierNotify, 2, ORGANIZATION);
      });

      function assertCalledServiceNTimesWith (serviceSpy, timesCalled, arg) {
        expect(serviceSpy.callCount).toBe(timesCalled);
        sinon.assert.calledWithExactly(serviceSpy, arg);
      }
    });
  });

});
