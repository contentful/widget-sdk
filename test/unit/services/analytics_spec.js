'use strict';

describe('analytics', function () {
  beforeEach(function () {

    module('contentful/test', function (environment) {
      environment.env = 'production';
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

    this.segment   = this.$inject('segment') ;
    sinon.stub(this.segment, 'enable');
    sinon.stub(this.segment, 'disable');
    sinon.stub(this.segment, 'identify');
    sinon.stub(this.segment, 'track');
    sinon.stub(this.segment, 'page');

    this.totango   = this.$inject('totango') ;
    sinon.stub(this.totango, 'enable');
    sinon.stub(this.totango, 'disable');
    sinon.stub(this.totango, 'initialize');
    sinon.stub(this.totango, 'setModule');
    sinon.stub(this.totango, 'track');

    this.analytics = this.$inject('analytics');
  });

  it('should enable', function() {
    this.analytics.enable();
    sinon.assert.called(this.segment.enable);
    sinon.assert.called(this.totango.enable);
  });

  it('should disable', function() {
    this.analytics.disable();
    sinon.assert.called(this.segment.disable);
    sinon.assert.called(this.totango.disable);
    expect(this.analytics.track).toBe(_.noop);
  });

  describe('setSpace', function(){
    beforeEach(function(){
      this.userData.signInCount = 1;
      this.analytics.setUserData(this.userData);
    });

    it('setSpace should set space data and initialize', function() {
      sinon.assert.calledWith(this.segment.identify, 'h4nswur5t', this.userData);
      sinon.assert.notCalled(this.totango.initialize);
      this.analytics.setSpace(this.space);
      sinon.assert.calledWith(this.totango.initialize, this.userData, this.space.data.organization);
    });
  });

  describe('setUserData', function(){
    beforeEach(function(){
      this.analytics.setSpace(this.space);
    });

    it('setSpace should set space data and initialize', function() {
      sinon.assert.notCalled(this.segment.identify);
      sinon.assert.notCalled(this.totango.initialize);
      this.analytics.setUserData(this.userData);
      sinon.assert.calledWith(this.segment.identify, 'h4nswur5t', this.userData);
      sinon.assert.calledWith(this.totango.initialize, this.userData, this.space.data.organization);
    });

    it('calls identify with new data', function() {
      this.analytics.setUserData(this.userData);
      this.analytics.addIdentifyingData({data: 'lolcat'});
      sinon.assert.calledTwice(this.segment.identify);
      sinon.assert.calledWith(this.segment.identify, 'h4nswur5t', {data: 'lolcat'});
    });
  });

  it('should track', function(){
    this.analytics.track('Event', {data: 'foobar'});
    sinon.assert.calledWith(this.segment.track, 'Event', {data: 'foobar'});
  });

  it('should track totango', function(){
    this.analytics.trackTotango('Event');
    sinon.assert.calledWith(this.totango.track, 'Event');
  });

  describe('stateActivated', function() {
    beforeEach(function(){
      this.state = {
        name: 'spaces.detail.entries.detail',
      };
      this.stateParams = {
        spaceId: 'spaceId',
        entryId: 'entryId'
      };
      this.analytics.stateActivated(this.state, this.stateParams);
    });

    it('should set the section in totango', function(){
      sinon.assert.calledWith(this.totango.setModule, this.state.name);
    });

    it('should set the page in segment', function() {
      sinon.assert.calledWith(this.segment.page, this.state.name, { spaceId: 'spaceId', entryId: 'entryId'});
    });

    it('should track segment', function(){
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
