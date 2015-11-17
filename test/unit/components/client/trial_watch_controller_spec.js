'use strict';

describe('Trial Watch controller', function () {
  var scope;
  var trialWatchCtrl;
  var broadcastStub;
  var momentStub, momentDiffStub, momentIsAfterStub;
  var $window, $q;

  function makeSpace(organization) {
    organization.sys = {id: '42'};
    return {
      data: {
        organization: organization
      }
    };
  }

  function makeScopeUserOwnScopeSpaceOrganization () {
    makeUserOwnOrganization(scope.user, scope.spaceContext.space.data.organization);
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
    momentDiffStub = sinon.stub();
    momentIsAfterStub = sinon.stub();
    momentStub = sinon.stub();
    momentStub.returns({
      diff: momentDiffStub,
      isAfter: momentIsAfterStub
    });

    module('contentful/test', function ($provide) {
      $provide.value('moment', momentStub);
    });

    inject(function ($rootScope, $controller, _$window_, _$q_) {
      scope = $rootScope.$new();
      scope.user = {
        organizationMemberships: []
      };

      broadcastStub = sinon.stub($rootScope, '$broadcast');

      $window = _$window_;
      $q = _$q_;

      trialWatchCtrl = $controller('TrialWatchController', {
        $scope: scope
      });
    });
  });

  afterEach(function () {
    broadcastStub.restore();
  });

  describe('without trial user', function () {
    beforeEach(function () {
      scope.spaceContext = {
        space: makeSpace({})
      };
      scope.$digest();
    });

    it('removes no other notification currently shown', function () {
      sinon.assert.notCalled(broadcastStub);
    });
  });

  describe('shows a persistent notification', function() {
    beforeEach(function () {
      jasmine.clock().install();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    describe('for a trial subscription', function () {
      beforeEach(function(){
        scope.spaceContext = {
          space: makeSpace({
            subscriptionState: 'trial',
            trialPeriodEndsAt: '2013-12-13T13:28:44Z',
            name: 'TEST_ORGA_NAME'
          })
        };
      });

      describe('already ended', function () {
        beforeEach(function() {
          trialHoursLeft(0);
        });

        describe('for user owning the organization', function () {
          beforeEach(function() {
            makeScopeUserOwnScopeSpaceOrganization();
            scope.$digest();
          });

          itShowsAMessage(/Your trial has ended.*TEST_ORGA_NAME organization/);
          itShowsAMessage(/insert your billing information/);

          itShowsAnActionMessage();

          itHasAnAction();


        });

        describe('for user not owning the organization', function () {
          beforeEach(function () {
            scope.$digest();
          });

          itShowsAMessage(/Your trial has ended.*TEST_ORGA_NAME organization/);
          itShowsAMessage(/contact the account owner/);

          itDoesNotShowAnActionMessage();

          itDoesNotHaveAnAction();
        });
      });

      describe('ending in less than an hour', function () {
        beforeEach(function () {
          makeScopeUserOwnScopeSpaceOrganization();
          trialHoursLeft(0.2);
          scope.$digest();
        });

        itShowsAMessage(/0(.*)hours left in trial/);

        itShowsAnActionMessage();

        itHasAnAction();
      });

      describe('ending in less than a day', function () {
        beforeEach(function () {
          makeScopeUserOwnScopeSpaceOrganization();
          trialHoursLeft(20);
          scope.$digest();
        });

        itShowsAMessage(/20(.*)hours left in trial/);

        itShowsAnActionMessage();

        itHasAnAction();
      });

      describe('ending in a few days', function () {
        beforeEach(function () {
          makeScopeUserOwnScopeSpaceOrganization();
          trialHoursLeft(76);
          scope.$digest();
        });

        itShowsAnActionMessage();

        itHasAnAction();
      });

      describe('no action', function () {
        beforeEach(function () {
          scope.$digest();
        });

        itDoesNotShowAnActionMessage();

        itDoesNotHaveAnAction();
      });

    });

    describe('for a free subscription', function () {
      beforeEach(function(){
        scope.spaceContext = {
          space: makeSpace({
            subscriptionState: 'active',
            subscriptionPlan: {
              paid: false,
              kind: 'default'
            }
          })
        };
      });

      describe('with an action', function () {
        beforeEach(function () {
          makeScopeUserOwnScopeSpaceOrganization();
          scope.$digest();
        });

        itShowsAMessage('free version');

        itShowsAnActionMessage();

        itHasAnAction();
      });

      describe('no action', function () {
        beforeEach(function () {
          scope.$digest();
        });

        itDoesNotShowAnActionMessage();

        itDoesNotHaveAnAction();
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

});
