import sinon from 'sinon';
import { $initialize, $apply, $inject } from 'test/utils/ng';

describe('states/spaces', () => {
  beforeEach(async function() {
    this.spaceData = { sys: { id: 'SPACE' } };

    this.tokenStore = {
      getSpace: sinon.stub().resolves(this.spaceData)
    };
    this.system.set('services/TokenStore.es6', this.tokenStore);

    const states = await this.system.import('states/states.es6');
    const { default: spaceState } = await this.system.import('states/Spaces.es6');

    await $initialize(this.system, $urlRouterProvider => {
      // We do not want to sync the $location to the $urlRouter
      $urlRouterProvider.deferIntercept(true);
    });

    states.load([spaceState]);
    this.spaceContext = $inject('mocks/spaceContext').init();
    this.$state = $inject('$state');
  });

  it('requests the space from the tokenStore', function() {
    this.$state.go('spaces.detail', { spaceId: 'SPACE' });
    $apply();
    sinon.assert.calledWith(this.tokenStore.getSpace, 'SPACE');
  });

  it('resets the space context', function() {
    this.$state.go('spaces.detail', { spaceId: 'SPACE' });
    $apply();
    sinon.assert.calledWith(this.spaceContext.resetWithSpace, this.spaceData);
  });
});
