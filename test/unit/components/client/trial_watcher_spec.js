'use strict';

describe('TrialWatcher', function () {
  var broadcastStub, openPaywallStub;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('paywallOpener', {
        openPaywall: sinon.stub()
      });
    });

    var dialogsInitController = this.$inject('dialogsInitController');
    var moment = this.$inject('moment');
    var OrganizationList = this.$inject('OrganizationList');
    var spaceContext = this.$inject('spaceContext');
    var $rootScope = this.$inject('$rootScope');

    broadcastStub = sinon.stub($rootScope, '$broadcast').returns({});
    openPaywallStub = this.$inject('paywallOpener').openPaywall;

    this.organization = {sys: {id: 42}};
    var membership = {organization: this.organization};
    OrganizationList.resetWithUser({organizationMemberships: [membership]});
    dialogsInitController.init();

    this.setupOrganization = function (extension) {
      _.extend(membership.organization, extension);
      spaceContext.space = {
        getId: _.constant('some-space-id'),
        data: {organization: membership.organization}
      };
    };

    this.makeOwner = function () { membership.role = 'owner'; };
    this.makeAdmin = function () { membership.role = 'admin'; };

    this.trialHoursLeft = (hours) => {
      this.organization.trialPeriodEndsAt = moment().add(hours, 'h').toISOString();
    };
  });

  afterEach(function () {
    broadcastStub.restore();
    broadcastStub = openPaywallStub = null;
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
      jasmine.clock().mockDate(new Date());
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    describe('for a trial subscription', function () {
      beforeEach(function () {
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
      beforeEach(function () {
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
      sinon.assert.calledWith(openPaywallStub,
        sinon.match.any, sinon.match.has('offerPlanUpgrade', true));
    });
  }

  function itOpensPaywallToNotifyTheUser () {
    itOpensPaywall();

    it('does not allow setting up payment', function () {
      sinon.assert.neverCalledWith(openPaywallStub,
        sinon.match.any, sinon.match.has('offerPlanUpgrade', true));
    });
  }

  function itOpensPaywall () {
    it('opens the paywall modal dialog for the test organization', function () {
      sinon.assert.calledOnce(openPaywallStub);
      sinon.assert.calledWith(openPaywallStub, this.organization);
    });
  }

  function itDoesNotOpenPaywall () {
    it('does not open the paywall modal dialog', function () {
      sinon.assert.notCalled(openPaywallStub);
    });
  }
});
