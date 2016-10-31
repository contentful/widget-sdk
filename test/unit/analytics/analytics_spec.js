'use strict';

describe('analytics', function () {
  beforeEach(function () {
    this.gtm = {
      enable: sinon.spy(),
      disable: sinon.spy(),
      push: sinon.spy()
    };

    module('contentful/test', (environment, $provide) => {
      environment.env = 'production';
      $provide.value('analytics/gtm', this.gtm);
    });

    this.userData = {
      firstName: 'Hans',
      lastName: 'Wurst',
      sys: {id: 'h4nswur5t'}
    };

    this.space = {data: {
      tutorial: false,
      organization: {
        sys: {id: 'orgId'},
        subscriptionState: 'subscriptionStateValue',
        invoiceState: 'invoiceStateValue',
        subscriptionPlan: {
          sys: {id: 'subscriptionPlanId'},
          name: 'subscriptionPlanName' } } }};

    this.segment = this.$inject('segment');
    sinon.stub(this.segment, 'enable');
    sinon.stub(this.segment, 'disable');
    sinon.stub(this.segment, 'identify');
    sinon.stub(this.segment, 'track');
    sinon.stub(this.segment, 'page');

    this.analytics = this.$inject('analytics');
  });

  describe('#enable()', function () {
    beforeEach(function () {
      this.analytics.enable(this.userData);
    });

    it('enables segment', function () {
      sinon.assert.called(this.segment.enable);
    });

    it('enables GTM and identifies the user', function () {
      sinon.assert.called(this.gtm.enable);
      sinon.assert.calledWith(this.gtm.push, {
        event: 'app.open',
        userId: this.userData.sys.id
      });
    });
  });

  it('should disable', function () {
    this.analytics.disable();
    sinon.assert.called(this.segment.disable);
    expect(this.analytics.track).toBe(_.noop);
  });

  describe('setSpace', function () {
    it('should set space data and initialize', function () {
      this.userData.signInCount = 1;
      this.analytics.enable(this.userData);
      sinon.assert.calledWith(this.segment.identify, 'h4nswur5t', this.userData);
    });
  });

  describe('identifying data', function () {
    beforeEach(function () {
      this.analytics.setSpace(this.space);
    });

    it('setSpace should set space data and initialize', function () {
      sinon.assert.notCalled(this.segment.identify);
      this.analytics.enable(this.userData);
      sinon.assert.calledWith(this.segment.identify, 'h4nswur5t', this.userData);
    });

    it('calls identify with new data', function () {
      this.analytics.enable(this.userData);
      this.analytics.addIdentifyingData({data: 'lolcat'});
      sinon.assert.calledTwice(this.segment.identify);
      sinon.assert.calledWith(this.segment.identify, 'h4nswur5t', {data: 'lolcat'});
    });
  });

  it('should track', function () {
    this.analytics.track('Event', {data: 'foobar'});
    sinon.assert.calledWith(this.segment.track, 'Event', {data: 'foobar'});
  });

  describe('stateActivated', function () {
    beforeEach(function () {
      this.state = {
        name: 'spaces.detail.entries.detail'
      };
      this.stateParams = {
        spaceId: 'spaceId',
        entryId: 'entryId'
      };

      const $rootScope = this.$inject('$rootScope');
      this.broadcast = function () {
        $rootScope.$broadcast('$stateChangeSuccess', this.state, this.stateParams);
      }.bind(this);
    });

    describe('enabled', function () {
      beforeEach(function () {
        this.analytics.enable(this.userData);
        this.broadcast();
      });

      it('should set the page in segment', function () {
        sinon.assert.calledWith(this.segment.page, this.state.name, this.stateParams);
      });

      it('should track segment', function () {
        sinon.assert.called(this.segment.track);
      });
    });

    describe('When disabled', function () {
      it('does not track by default', function () {
        this.broadcast();
        sinon.assert.notCalled(this.segment.track);
      });

      it('does not track if was enabled and disabled', function () {
        this.analytics.enable(this.userData);
        this.analytics.disable();
        this.broadcast();
        sinon.assert.notCalled(this.segment.track);
      });
    });
  });

  describe('trackPersistentNotificationAction()', function () {
    describe('without organization data available', function () {
      it('tracks to segment', function () {
        this.analytics.trackPersistentNotificationAction('ACTION_NAME');
        sinon.assert.calledWith(this.segment.track, sinon.match.string, {
          action: 'ACTION_NAME',
          currentPlan: null
        });
      });
    });

    describe('with organization data set', function () {
      it('tracks to segment and contains current plan name', function () {
        this.analytics.setSpace(this.space);
        this.analytics.trackPersistentNotificationAction('ACTION_NAME');
        sinon.assert.calledWith(this.segment.track, sinon.match.string, sinon.match({
          action: 'ACTION_NAME',
          currentPlan: 'subscriptionPlanName'
        }));
      });
    });
  });

});
