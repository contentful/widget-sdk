'use strict';

describe('states/spaces', function () {

  beforeEach(module('contentful/test', function ($urlRouterProvider) {
    // We do not want to sync the $location to the $urlRouter
    $urlRouterProvider.deferIntercept(true);
  }));

  beforeEach(function () {
    const cfStub = this.$inject('cfStub');
    this.space = cfStub.space('SPACE');
    this.space.getPublishedContentTypes = sinon.stub().resolves([]);
    this.space.getContentTypes = sinon.stub().resolves([]);

    this.tokenStore =  this.mockService('tokenStore');
    this.tokenStore.getSpace.resolves(this.space);

    const states = this.$inject('states');
    const spaceState = this.$inject('states/spaces');
    states.load([spaceState]);

    const $state = this.$inject('$state');
    this.$state = $state;

    this.widgets = this.$inject('widgets');
    this.widgets.setSpace = sinon.stub().resolves();
  });

  it('requests the space from the tokenStore', function () {
    this.$state.go('spaces.detail', {spaceId: 'SPACE'});
    this.$apply();
    sinon.assert.calledWith(this.tokenStore.getSpace, 'SPACE');
  });

  it('reset the space context', function () {
    const spaceContext = this.$inject('spaceContext');
    const resetWithSpace = sinon.spy(spaceContext, 'resetWithSpace');
    this.$state.go('spaces.detail', {spaceId: 'SPACE'});
    this.$apply();
    sinon.assert.calledWith(resetWithSpace, this.space);
  });

  it('exposes the space as a local', function () {
    this.$state.go('spaces.detail', {spaceId: 'SPACE'});
    this.$apply();
    expect(this.$state.$current.locals.globals.space).toEqual(this.space);
  });

  it('sets the space on the widgets service', function () {
    this.$state.go('spaces.detail', {spaceId: 'SPACE'});
    this.$apply();
    sinon.assert.calledWith(this.widgets.setSpace, this.space);
  });

});
