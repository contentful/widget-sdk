'use strict';

describe('states/spaces', function () {

  beforeEach(module('contentful/test', function ($urlRouterProvider) {
    // We do not want to sync the $location to the $urlRouter
    $urlRouterProvider.deferIntercept(true);
  }));

  beforeEach(function () {
    var states = this.$inject('states');
    var spaceState = this.$inject('states/spaces');
    states.load([spaceState]);

    var $state = this.$inject('$state');
    this.$state = $state;

    var cfStub = this.$inject('cfStub');
    this.adapter = cfStub.adapter;
    this.space = cfStub.space('SPACE');

    this.tokenStore = this.$inject('tokenStore');
    this.tokenStore.getSpace = sinon.stub().resolves(this.space);

    this.widgets = this.$inject('widgets');
    this.widgets.setSpace = sinon.stub().resolves();
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

  it('sets the space on the widgets service', function () {
    this.$state.go('spaces.detail', {spaceId: 'SPACE'});
    this.$apply();
    sinon.assert.calledWith(this.widgets.setSpace, this.space);
  });

});
