'use strict';

describe('Gatekeeper Message Handler', function () {
  beforeEach(function () {
    module('contentful/test');
    this.handle = this.$inject('handleGatekeeperMessage');
  });

  describe('actions on message', function () {
    it('says "goodbye" to a cancelled user', function () {
      const goodbye = this.$inject('authentication').goodbye = sinon.spy();
      this.handle({action: 'create', type: 'UserCancellation'});
      sinon.assert.calledOnce(goodbye);
    });

    it('opens the space creation dialog', function () {
      const CreateSpace = this.$inject('services/CreateSpace');
      CreateSpace.showDialog = sinon.stub();
      this.handle({action: 'new', type: 'space', organizationId: 'orgId'});
      sinon.assert.calledOnce(CreateSpace.showDialog.withArgs('orgId'));
    });

    it('leaves a deleted space', function () {
      const refresh = this.$inject('tokenStore').refresh = sinon.spy();
      const go = this.$inject('$state').go = sinon.spy();

      this.handle({action: 'delete', type: 'space'});
      sinon.assert.calledOnce(refresh);
      sinon.assert.calledOnce(go.withArgs('home'));
    });

    it('shows notification', function () {
      const notification = this.$inject('notification');
      notification.info = sinon.spy();
      notification.warn = sinon.spy();
      this.handle({type: 'flash', resource: {message: 'OK', type: 'info'}});
      this.handle({type: 'flash', resource: {message: 'FAIL', type: 'error'}});
      sinon.assert.calledOnce(notification.info.withArgs('OK'));
      sinon.assert.calledOnce(notification.warn.withArgs('FAIL'));
    });

    it('changes URL when triggered', function () {
      const url = this.$inject('$location').url = sinon.spy();
      this.handle({action: 'navigate', type: 'location', path: 'blah/blah'});
      sinon.assert.calledOnce(url.withArgs('blah/blah'));
    });

    describe('updates location', function () {
      beforeEach(function () {
        this.$state = this.$inject('$state');
        this.$state.href = sinon.stub().returns('/account/profile/user/');
        this.$state.go = sinon.spy();
      });

      it('silently update URL if state is the same', function () {
        this.handle({
          action: 'update',
          type: 'location',
          path: '/account/profile/user/blah/blah/'
        });
        sinon.assert.calledOnce(this.$state.go);
        expect(this.$state.go.lastCall.args[1].pathSuffix).toBe('blah/blah/');
      });

      it('update location if the state has changed', function () {
        const $location = this.$inject('$location');
        $location.url = sinon.spy();

        const newPath = '/account/profile/space_memberships/blah/blah';
        this.handle({
          action: 'update',
          type: 'location',
          path: newPath
        });
        sinon.assert.notCalled(this.$state.go);
        sinon.assert.calledOnce($location.url.withArgs(newPath));
      });
    });

    it('updates token if present', function () {
      const token = {super: 'token'};
      const update = this.$inject('authentication').updateTokenLookup = sinon.spy();
      this.handle({token: token});
      sinon.assert.calledOnce(update.withArgs(token));
    });

    it('refreshes token for any other message', function () {
      const refresh = this.$inject('tokenStore').refresh = sinon.spy();
      this.handle({blah: 'blah'});
      sinon.assert.calledOnce(refresh);
    });
  });
});
