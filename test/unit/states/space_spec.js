'use strict';

describe('states/spaces', () => {
  beforeEach(module('contentful/test', $urlRouterProvider => {
    // We do not want to sync the $location to the $urlRouter
    $urlRouterProvider.deferIntercept(true);
  }));

  beforeEach(function () {
    this.spaceData = {sys: {id: 'SPACE'}};
    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.tokenStore = this.mockService('services/TokenStore');
    this.tokenStore.getSpace.resolves(this.spaceData);

    const states = this.$inject('states');
    const spaceState = this.$inject('states/Spaces').default;
    states.load([spaceState]);

    this.$state = this.$inject('$state');
  });

  it('requests the space from the tokenStore', function () {
    this.$state.go('spaces.detail', {spaceId: 'SPACE'});
    this.$apply();
    sinon.assert.calledWith(this.tokenStore.getSpace, 'SPACE');
  });

  it('resets the space context', function () {
    this.$state.go('spaces.detail', {spaceId: 'SPACE'});
    this.$apply();
    sinon.assert.calledWith(this.spaceContext.resetWithSpace, this.spaceData);
  });
});
