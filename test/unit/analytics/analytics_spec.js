'use strict';

describe('analytics', function () {
  beforeEach(function () {
    module('contentful/test', (environment) => {
      environment.env = 'production';
    });

    this.userData = {
      firstName: 'Hans',
      lastName: 'Wurst',
      sys: {id: 'userid'}
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

    it('calls identify with new data when persona is selected', function () {
      this.analytics.enable(this.userData);
      this.analytics.trackPersonaSelection('code');
      sinon.assert.calledTwice(this.segment.identify);
      const expected = _.extend({personaName: 'Coder'}, this.userData);
      sinon.assert.calledWith(this.segment.identify, 'userid', expected);
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
});
