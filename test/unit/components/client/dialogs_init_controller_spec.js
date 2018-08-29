'use strict';

describe('dialogsInitController', () => {
  beforeEach(function() {
    this.spaceContext = { getId: sinon.stub() };
    this.OrganizationRoles = { isEmpty: sinon.stub() };
    this.initEmailSpy = sinon.spy();
    this.initOnboardingSpy = sinon.spy();
    this.subscriptionNotifierNotify = sinon.spy();

    module('contentful/test', $provide => {
      $provide.value('spaceContext', this.spaceContext);
      $provide.value('services/OrganizationRoles', this.OrganizationRoles);
      $provide.value('onboardingController', {
        init: this.initOnboardingSpy
      });
      $provide.value('activationEmailResendController', {
        init: this.initEmailSpy
      });
      $provide.value('subscriptionNotifier', {
        notifyAbout: this.subscriptionNotifierNotify
      });
    });

    this.$rootScope = this.$inject('$rootScope');

    const controller = this.$inject('dialogsInitController');
    controller.init();
    this.$rootScope.$apply();
  });

  describe('init()', () => {
    describe('notifier services communication', () => {
      const ORGANIZATION = {};

      beforeEach(function() {
        this.spaceContext.getId.returns('SPACE_ID');
        this.spaceContext.organizationContext = { organization: ORGANIZATION };
        this.$apply();
      });

      it('calls `subscriptionNotifier.notifyAbout()`', function() {
        assertCalledServiceNTimesWith(this.subscriptionNotifierNotify, 1, ORGANIZATION);
      });

      it('calls `notifyAbout()` again on switching space', function() {
        this.spaceContext.getId.returns('ANOTHER_SPACE_ID');
        this.$apply();
        assertCalledServiceNTimesWith(this.subscriptionNotifierNotify, 2, ORGANIZATION);
      });

      function assertCalledServiceNTimesWith(serviceSpy, timesCalled, arg) {
        expect(serviceSpy.callCount).toBe(timesCalled);
        sinon.assert.calledWithExactly(serviceSpy, arg);
      }
    });
  });
});
