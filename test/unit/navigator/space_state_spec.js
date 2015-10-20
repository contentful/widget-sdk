'use strict';

describe('navigator', function () {
  describe('space state', function () {

    beforeEach(module('contentful/test', function ($urlRouterProvider) {
      // We do not want to sync the $location to the $urlRouter
      $urlRouterProvider.deferIntercept(true);
    }));


    beforeEach(function () {
      var $state = this.$inject('$state');
      this.$state = $state;

      var cfStub = this.$inject('cfStub');
      this.space = cfStub.space('SPACE');

      this.tokenStore = this.$inject('tokenStore');
      this.tokenStore.getSpace = sinon.stub().resolves(this.space);
    });

    it('requests the space from the tokenStore', function () {
      this.$state.go('spaces.detail', {spaceId: 'SPACE'});
      this.$apply();
      sinon.assert.calledWith(this.tokenStore.getSpace, 'SPACE');
    });

    it('reset the space context', function () {
      var spaceContext = this.$inject('spaceContext');
      var resetWithSpace = sinon.spy(spaceContext, 'resetWithSpace');
      this.$state.go('spaces.detail', {spaceId: 'SPACE'});
      this.$apply();
      sinon.assert.calledWith(resetWithSpace, this.space);
    });

    it('exposes the space as a local', function () {
      this.$state.go('spaces.detail', {spaceId: 'SPACE'});
      this.$apply();
      expect(this.$state.$current.locals.globals.space).toEqual(this.space);
    });

  });
});
