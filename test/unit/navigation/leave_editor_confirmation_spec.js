import sinon from 'sinon';
import { $initialize, $inject, $apply } from 'test/utils/ng';

describe('navigator', () => {
  describe('leave editor confirmation', () => {
    beforeEach(async function () {
      await $initialize(this.system, ($stateProvider, $urlRouterProvider) => {
        $stateProvider.state('dirty', {
          data: {
            dirty: true,
          },
        });

        $stateProvider.state('leave', {});

        // We do not want to sync the $location to the $urlRouter
        $urlRouterProvider.deferIntercept(true);
      });

      const { setupStateChangeHandlers } = await this.system.import(
        'navigation/stateChangeHandlers'
      );

      setupStateChangeHandlers();

      const $state = $inject('$state');
      this.$state = $state;
      this.dirtyState = $state.get('dirty');

      $state.go('dirty');
      $apply();
      expect($state.current.name).toEqual('dirty');
    });

    it('request leave confirmation', function () {
      const confirm = sinon.stub().resolves();
      this.dirtyState.data.requestLeaveConfirmation = confirm;
      this.$state.go('leave');
      sinon.assert.calledOnce(confirm);
    });

    it('transitions away when leave is confimed', function () {
      const confirm = sinon.stub().resolves(true);
      this.dirtyState.data.requestLeaveConfirmation = confirm;

      const exit = sinon.stub();
      this.dirtyState.onExit = exit;

      this.$state.go('leave');
      $apply();
      sinon.assert.calledOnce(exit);
    });

    it('does not transitions away when leave is cancelled', function () {
      const confirm = sinon.stub().resolves(false);
      this.dirtyState.data.requestLeaveConfirmation = confirm;

      const exit = sinon.stub();
      this.dirtyState.onExit = exit;

      this.$state.go('leave');
      $apply();
      sinon.assert.notCalled(exit);
    });
  });
});