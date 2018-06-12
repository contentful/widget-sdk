'use strict';

describe('navigator', () => {
  describe('leave editor confirmation', () => {
    beforeEach(module('contentful/test', $stateProvider => {
      $stateProvider.state('dirty', {
        data: {
          dirty: true
        }
      });

      $stateProvider.state('leave', {});
    }));

    beforeEach(module($urlRouterProvider => {
      // We do not want to sync the $location to the $urlRouter
      $urlRouterProvider.deferIntercept(true);
    }));


    beforeEach(function () {
      const stateChangeHandlers = this.$inject('navigation/stateChangeHandlers');
      stateChangeHandlers.setup();

      const $state = this.$inject('$state');
      this.$state = $state;
      this.dirtyState = $state.get('dirty');

      $state.go('dirty');
      this.$apply();
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
      this.$apply();
      sinon.assert.calledOnce(exit);
    });

    it('does not transitions away when leave is cancelled', function () {
      const confirm = sinon.stub().resolves(false);
      this.dirtyState.data.requestLeaveConfirmation = confirm;

      const exit = sinon.stub();
      this.dirtyState.onExit = exit;

      this.$state.go('leave');
      this.$apply();
      sinon.assert.notCalled(exit);
    });
  });
});
