'use strict';

describe('TrialWatcher', function () {
  var $rootScope, spaceContext, authentication, $q;
  var broadcastStub, momentDiffStub, momentIsAfterStub, openDialogStub;

  afterEach(function () {
    $rootScope = spaceContext = authentication = $q =
      broadcastStub = momentDiffStub = momentIsAfterStub =
      openDialogStub = null;
  });

  function makeSpace(organization) {
    organization.sys = {id: '42'};
    return {
      data: {
        organization: organization
      }
    };
  }

  function makeScopeUserOwnScopeSpaceOrganization () {
    makeUserOwnOrganization(authentication.tokenLookup.sys.createdBy, spaceContext.space.data.organization);
  }

  function makeUserOwnOrganization (user, organization) {
    user.organizationMemberships = [{
      organization: organization,
      role: 'owner'
    }];
  }

  function trialHoursLeft( hours ) {
    momentDiffStub.returns(Math.floor(hours));
    momentIsAfterStub.returns( hours !== 0 );
  }

  beforeEach(function () {
    openDialogStub = sinon.spy(function() {
      return {promise: $q.defer().promise};
    });

    module('contentful/test', function ($provide) {
      $provide.value('modalDialog', {
        open: openDialogStub
      });
    });

    var TrialWatcher = this.$inject('TrialWatcher');
    var moment = this.$inject('moment');

    $rootScope = this.$inject('$rootScope');
    spaceContext = this.$inject('spaceContext');
    authentication = this.$inject('authentication');
    $q = this.$inject('$q');

    broadcastStub = sinon.stub($rootScope, '$broadcast').returns({});
    moment.fn.diff = momentDiffStub = sinon.stub();
    moment.fn.isAfter = momentIsAfterStub = sinon.stub();
    authentication.tokenLookup = {sys: {createdBy: {organizationMemberships: []}}};

    TrialWatcher.init();
  });

  afterEach(function () {
    broadcastStub.restore();
  });

  describe('without trial user', function () {
    beforeEach(function () {
      spaceContext.space =  makeSpace({subscriptionState: 'testState'});
      $rootScope.$apply();
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
      beforeEach(function(){
        spaceContext.space = makeSpace({
          subscriptionState: 'trial',
          trialPeriodEndsAt: '2013-12-13T13:28:44Z',
          name: 'TEST_ORGA_NAME'
        });
      });

      describe('already ended', function () {
        beforeEach(function() {
          trialHoursLeft(0);
        });

        describe('for user owning the organization', function () {
          beforeEach(function() {
            makeScopeUserOwnScopeSpaceOrganization();
            $rootScope.$apply();
          });

          itShowsAMessage(/Your trial has ended.*TEST_ORGA_NAME organization/);
          itShowsAMessage(/insert your billing information/);

          itShowsAnActionMessage();

          itHasAnAction();

          itOpensPaywallForSettingUpPayment();
        });

        describe('for user not owning the organization', function () {
          beforeEach(function () {
            $rootScope.$apply();
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
          makeScopeUserOwnScopeSpaceOrganization();
          trialHoursLeft(0.2);
          $rootScope.$apply();
        });

        itShowsAMessage(/organization TEST_ORGA_NAME/);
        itShowsAMessage(/0(.*)hours left in trial/);

        itShowsAnActionMessage();

        itHasAnAction();

        itDoesNotOpenPaywall();
      });

      describe('ending in less than a day', function () {
        beforeEach(function () {
          makeScopeUserOwnScopeSpaceOrganization();
          trialHoursLeft(20);
          $rootScope.$apply();
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
          makeScopeUserOwnScopeSpaceOrganization();
          trialHoursLeft(76);
          $rootScope.$apply();
        });

        itShowsAnActionMessage();

        itHasAnAction();

        itDoesNotOpenPaywall();
      });

      describe('no action', function () {
        beforeEach(function () {
          $rootScope.$apply();
        });

        itDoesNotShowAnActionMessage();

        itDoesNotHaveAnAction();
      });

    });

    describe('for a free subscription', function () {
      beforeEach(function(){
        spaceContext.space = makeSpace({
          subscriptionState: 'active',
          subscriptionPlan: {
            paid: false,
            kind: 'default'
          }
        });
    });

      describe('with an action', function () {
        beforeEach(function () {
          makeScopeUserOwnScopeSpaceOrganization();
          $rootScope.$apply();
        });

        itShowsAMessage('free version');

        itShowsAnActionMessage();

        itHasAnAction();

        itDoesNotOpenPaywall();
      });

      describe('no action', function () {
        beforeEach(function () {
          $rootScope.$apply();
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
