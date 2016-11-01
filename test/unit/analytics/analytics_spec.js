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
      sys: {id: 'userid'}
    };

    this.space = {
      data: {
        tutorial: false,
        organization: {
          sys: {id: 'orgId'},
          subscriptionState: 'subscriptionStateValue',
          invoiceState: 'invoiceStateValue',
          subscriptionPlan: {
            sys: {id: 'subscriptionPlanId'},
            name: 'subscriptionPlanName'
          }
        }
      }
    };

    this.analytics = this.$inject('analytics');

    this.segment = this.$inject('segment');
    sinon.stub(this.segment, 'enable');
    sinon.stub(this.segment, 'disable');
    sinon.stub(this.segment, 'identify');
    sinon.stub(this.segment, 'track');
    sinon.stub(this.segment, 'page');
  });

  describe('#enable()', function () {
    it('enables segment', function () {
      this.analytics.enable(this.userData);
      sinon.assert.called(this.segment.enable);
    });

    it('enables GTM and identifies the user', function () {
      this.analytics.enable(this.userData);
      sinon.assert.called(this.gtm.enable);
      sinon.assert.calledWith(this.gtm.push, {
        event: 'app.open',
        userId: this.userData.sys.id
      });
    });

    it('is executed only once', function () {
      this.analytics.enable(this.userData);
      this.analytics.enable(this.userData);
      sinon.assert.calledOnce(this.segment.enable);
    });
  });

  describe('#disable()', function () {
    it('disables segment and turns enable into noop', function () {
      this.analytics.disable();
      sinon.assert.called(this.segment.disable);
      expect(this.analytics.enable).toBe(_.noop);
    });
  });

  describe('identifying data', function () {
    it('should identify when enabling the service', function () {
      sinon.assert.notCalled(this.segment.identify);
      this.analytics.enable(this.userData);
      sinon.assert.calledWith(this.segment.identify, 'userid', this.userData);
    });

    it('calls identify with new data', function () {
      this.analytics.enable(this.userData);
      this.analytics.addIdentifyingData({data: 'lolcat'});
      sinon.assert.calledTwice(this.segment.identify);
      sinon.assert.calledWith(this.segment.identify, 'userid', {data: 'lolcat'});
    });
  });

  it('should track', function () {
    this.analytics.track('Event', {data: 'foobar'});
    sinon.assert.calledWith(this.segment.track, 'Event', {data: 'foobar'});
  });

  describe('stateActivated', function () {
    const state = {name: 'spaces.detail.entries.detail'};
    const stateParams = {spaceId: 'spaceId', entryId: 'entryId'};

    beforeEach(function () {
      this.analytics.enable(this.userData);
      this.analytics.trackStateChange(state, stateParams);
    });

    it('should set the page in segment', function () {
      sinon.assert.calledWith(this.segment.page, state.name, stateParams);
    });

    it('should track segment', function () {
      sinon.assert.called(this.segment.track);
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
        this.analytics.trackSpaceChange(this.space);
        this.analytics.trackPersistentNotificationAction('ACTION_NAME');
        sinon.assert.calledWith(this.segment.track, sinon.match.string, sinon.match({
          action: 'ACTION_NAME',
          currentPlan: 'subscriptionPlanName'
        }));
      });
    });
  });
});
