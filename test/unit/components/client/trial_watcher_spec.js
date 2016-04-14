'use strict';

describe('TrialWatcher', function () {
  var broadcastStub, openDialogStub;

  beforeEach(function () {
    module('contentful/test');

    var TrialWatcher = this.$inject('TrialWatcher');
    var moment = this.$inject('moment');
    var OrganizationList = this.$inject('OrganizationList');
    var spaceContext = this.$inject('spaceContext');
    var $q = this.$inject('$q');
    var $rootScope = this.$inject('$rootScope');
    var modalDialog = this.$inject('modalDialog');

    broadcastStub = sinon.stub($rootScope, '$broadcast').returns({});
    openDialogStub = modalDialog.open = sinon.spy(function() {
      return {promise: $q.defer().promise};
    });

    var membership = {organization: {sys: {id: 42}}};
    OrganizationList.resetWithUser({organizationMemberships: [membership]});
    TrialWatcher.init();

    this.setupOrganization = function (extension) {
      _.extend(membership.organization, extension);
      spaceContext.space = {
        getId: _.constant('some-space-id'),
        data: {organization: membership.organization}
      };
    };

    this.makeOwner = function () { membership.role = 'owner'; };
    this.makeAdmin = function () { membership.role = 'admin'; };

    this.trialHoursLeft = function (hours) {
      moment.fn.diff = sinon.stub().returns(Math.floor(hours));
      moment.fn.isAfter = sinon.stub().returns(hours !== 0);
    };
  });

  afterEach(function () {
    broadcastStub.restore();
    broadcastStub = openDialogStub = null;
  });

  describe('without trial user', function () {
    beforeEach(function () {
      this.setupOrganization({subscriptionState: 'testState'});
      this.$apply();
    });

    describe('removal of old notification (e.g. after switch orga)', function () {
      it('calls broadcast with null once', function () {
        var notificationCalls = broadcastStub.args.filter(function (x) {
          return x[0] === 'persistentNotification';
        });

        expect(notificationCalls.length).toBe(1);
        expect(notificationCalls[0][1]).toBeNull();
      });
    });
  });

  describe('shows a persistent notification', function () {
    beforeEach(function () {
      jasmine.clock().install();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    describe('for a trial subscription', function () {
      beforeEach(function (){
        this.setupOrganization({
          subscriptionState: 'trial',
          trialPeriodEndsAt: '2013-12-13T13:28:44Z',
          name: 'TEST_ORGA_NAME'
        });
      });

      describe('already ended', function () {
        beforeEach(function () {
          this.trialHoursLeft(0);
        });

        describe('for user owning the organization', function () {
          beforeEach(function () {
            this.makeOwner();
            this.$apply();
          });

          itShowsAMessage(/Your trial has ended.*TEST_ORGA_NAME organization/);
          itShowsAMessage(/insert your billing information/);

          itShowsAnActionMessage();

          itHasAnAction();

          itOpensPaywallForSettingUpPayment();
        });

        describe('for user who is an admin in the organization', function () {
          beforeEach(function () {
            this.makeAdmin();
            this.$apply();
          });

          itShowsAMessage(/Your trial has ended.*TEST_ORGA_NAME organization/);
          itShowsAMessage(/contact the account owner/);

          itDoesNotShowAnActionMessage();

          itDoesNotHaveAnAction();

          itOpensPaywallToNotifyTheUser();
        });

        describe('for user not owning the organization', function () {
          beforeEach(function () {
            this.$apply();
          });

          itShowsAMessage(/Your trial has ended.*TEST_ORGA_NAME organization/);
          itShowsAMessage(/contact the account owner/);

          itDoesNotShowAnActionMessage();

          itDoesNotHaveAnAction();

          itOpensPaywallToNotifyTheUser();
        });
      });

      describe('ending in less than an hour', function () {
        beforeEach(function () {
          this.makeOwner();
          this.trialHoursLeft(0.2);
          this.$apply();
        });

        itShowsAMessage(/organization TEST_ORGA_NAME/);
        itShowsAMessage(/0(.*)hours left in trial/);

        itShowsAnActionMessage();

        itHasAnAction();

        itDoesNotOpenPaywall();
      });

      describe('ending in less than a day', function () {
        beforeEach(function () {
          this.makeOwner();
          this.trialHoursLeft(20);
          this.$apply();
        });

        itShowsAMessage(/organization TEST_ORGA_NAME/);
        itShowsAMessage(/20(.*)hours left in trial/);
        itShowsAMessage(/access to all features for 20 more hours/);

        itShowsAnActionMessage();

        itHasAnAction();

        itDoesNotOpenPaywall();
      });

      describe('ending in a few days', function () {
        beforeEach(function () {
          this.makeOwner();
          this.trialHoursLeft(76);
          this.$apply();
        });

        itShowsAnActionMessage();

        itHasAnAction();

        itDoesNotOpenPaywall();
      });

      describe('no action', function () {
        beforeEach(function () {
          this.$apply();
        });

        itDoesNotShowAnActionMessage();

        itDoesNotHaveAnAction();
      });

    });

    describe('for a free subscription', function () {
      beforeEach(function (){
        this.setupOrganization({
          subscriptionState: 'active',
          subscriptionPlan: {
            paid: false,
            kind: 'default'
          }
        });
      });

      describe('with an action', function () {
        beforeEach(function () {
          this.makeOwner();
          this.$apply();
        });

        itShowsAMessage('free version');

        itShowsAnActionMessage();

        itHasAnAction();

        itDoesNotOpenPaywall();
      });

      describe('no action', function () {
        beforeEach(function () {
          this.$apply();
        });

        itDoesNotShowAnActionMessage();

        itDoesNotHaveAnAction();

        itDoesNotOpenPaywall();
      });
    });
  });

  function itShowsAMessage (match) {
    it('shows a message', function () {
      expect(broadcastStub.args[0][1].message).toMatch(match);
    });
  }

  function itShowsAnActionMessage () {
    it('shows an action message', function () {
      expect(broadcastStub.args[0][1].actionMessage).toMatch(/upgrade/i);
    });
  }

  function itDoesNotShowAnActionMessage () {
    it('does not show an action message', function () {
      expect(broadcastStub.args[0][1].actionMessage).toBeUndefined();
    });
  }

  function itHasAnAction () {
    it('has an action', function () {
      expect(typeof broadcastStub.args[0][1].action).toBe('function');
    });
  }

  function itDoesNotHaveAnAction () {
    it('does not have an action', function () {
      expect(broadcastStub.args[0][1].action).toBeUndefined();
    });
  }

  function itOpensPaywallForSettingUpPayment () {
    itOpensPaywall();

    it('allows setting up payment', function () {
      expect(openDialogStub.args[0][0].scopeData.offerToSetUpPayment).toBe(true);
    });
  }

  function itOpensPaywallToNotifyTheUser () {
    itOpensPaywall();

    it('does not allow setting up payment', function () {
      expect(openDialogStub.args[0][0].scopeData.offerToSetUpPayment).toBe(false);
    });
  }

  function itOpensPaywall () {
    it('opens the paywall modal dialog', function () {
      expect(openDialogStub.calledOnce).toBe(true);
    });
  }

  function itDoesNotOpenPaywall () {
    it('does not open the paywall modal dialog', function () {
      expect(openDialogStub.called).toBe(false);
    });
  }
});
