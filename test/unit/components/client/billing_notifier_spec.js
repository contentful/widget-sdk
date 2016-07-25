'use strict';

describe('billingNotifier', () => {
  beforeEach(function () {
    this.$broadcast = sinon.spy();
    this.OrganizationList = {
      isOwner: sinon.stub().returns(true)
    };
    this.TheAccountView = {};

    module('contentful/test', ($provide) => {
      $provide.value('OrganizationList', this.OrganizationList);
      $provide.value('TheAccountView', this.TheAccountView);
    });

    const $rootScope = this.$inject('$rootScope');
    $rootScope.$broadcast = this.$broadcast;

    this.organization = {
      sys: {id: 42},
      zExpiredPaymentMethod: {
        type: 'CreditCard',
        displayNumber: '************1337'
      }
    };

    this.notifier = this.$inject('billingNotifier');
  });

  describe('expired payment method notification', function () {
    itIsNotShownIf('user is not the org owner', function () {
      this.OrganizationList.isOwner.returns(false);
    });

    itIsNotShownIf('`zExpiredPaymentMethod` is not set', function () {
      delete this.organization.zExpiredPaymentMethod;
    });

    itIsNotShownIf('`zExpiredPaymentMethod.type != "CreditCard"`', function () {
      this.organization.zExpiredPaymentMethod.type = 'wire';
    });

    it('is shown if `zExpiredPaymentMethod` is set for current org', function () {
      this.notifier.notifyAbout(this.organization);
      sinon.assert.calledOnce(this.$broadcast);
      sinon.assert.calledWith(this.$broadcast, 'persistentNotification');
    });

    describe('broadcasted notificaiton object', function () {
      beforeEach(function () {
        this.notifier.notifyAbout(this.organization);
        this.args = this.$broadcast.args[0][1];
      });

      it('has a message with the credit card number`s last digits', function () {
        expect(this.args.message).toMatch(/credit card.* 1337 has expired/);
      });

      it('has an `actionMessage`', function () {
        expect(this.args.actionMessage).toBe('Update credit card');
      });

      it('has an `action` which opens the billing view', function () {
        this.TheAccountView.goToBilling = sinon.spy();
        this.args.action();
        sinon.assert.calledOnce(this.TheAccountView.goToBilling);
      });
    });
  });

  function itIsNotShownIf (msg, setup) {
    it('is not shown if ' + msg, function () {
      (setup || angular.noop).call(this);
      this.notifier.notifyAbout(this.organization);
      sinon.assert.notCalled(this.$broadcast);
    });
  }
});
