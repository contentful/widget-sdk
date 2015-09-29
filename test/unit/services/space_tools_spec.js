'use strict';

describe('Space tools service', function () {
  var spaceTools, spaceContext, analytics, $state, TheAccountView;

  function createSpace(id) {
    return {
      getId: _.constant(id),
      data: { name: 'test_space' }
    };
  }

  beforeEach(function () {
    module('contentful/test');
    spaceTools = this.$inject('spaceTools');
    spaceContext = this.$inject('spaceContext');
    analytics = this.$inject('analytics');
    $state = this.$inject('$state');
    TheAccountView = this.$inject('TheAccountView');

    sinon.stub(analytics, 'track');
    sinon.stub($state, 'go');
    sinon.stub(spaceContext, 'getId').returns(123);
  });

  describe('if we are selecting the current space', function () {
    beforeEach(function () {
      spaceTools.goTo(createSpace(123));
    });

    it('dont track analytics', function () {
      sinon.assert.notCalled(analytics.track);
    });

    it('dont route to another space', function () {
      sinon.assert.notCalled($state.go);
    });
  });

  describe('if we are selecting the current space but in account section', function () {
    beforeEach(function () {
      sinon.stub(TheAccountView, 'isActive').returns(true);
      spaceTools.goTo(createSpace(123));
    });

    it('tracks analytics', function () {
      sinon.assert.called(analytics.track);
    });

    it('tracks the space properties', function () {
      expect(analytics.track.args[0][1]).toEqual({spaceId: 123, spaceName: 'test_space'});
    });

    it('route to another space', function () {
      sinon.assert.calledWith($state.go, 'spaces.detail', { spaceId: 123 });
    });
  });

  describe('if we are selecting a different space', function () {
    beforeEach(function () {
      spaceTools.goTo(createSpace(456));
    });

    it('tracks analytics', function () {
      sinon.assert.called(analytics.track);
    });

    it('tracks the space properties', function () {
      expect(analytics.track.args[0][1]).toEqual({spaceId: 456, spaceName: 'test_space'});
    });

    it('route to another space', function () {
      sinon.assert.calledWith($state.go, 'spaces.detail', { spaceId: 456 });
    });

    it('location in account set to false', function() {
      expect(TheAccountView.isActive()).toBeFalsy();
    });
  });
});
