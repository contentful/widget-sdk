'use strict';

describe('Gatekeeper Message Handler', function () {
  beforeEach(function () {
    module('contentful/test');
    this.handle = this.$inject('handleGatekeeperMessage');
  });

  describe('actions on message', function () {
    it('says "goodbye" to a cancelled user', function () {
      var goodbye = this.$inject('authentication').goodbye = sinon.spy();
      this.handle({action: 'create', type: 'UserCancellation'});
      sinon.assert.calledOnce(goodbye);
    });

    it('opens the space creation dialog', function () {
      var root = this.$inject('$rootScope');
      sinon.spy(root, '$broadcast');
      this.handle({action: 'new', type: 'space'});
      sinon.assert.calledOnce(root.$broadcast.withArgs('showCreateSpaceDialog'));
      root.$broadcast.restore();
    });

    it('leaves a deleted space', function () {
      var leave = this.$inject('spaceTools').leaveCurrent = sinon.spy();
      this.handle({action: 'delete', type: 'space'});
      sinon.assert.calledOnce(leave);
    });

    it('shows notification', function () {
      var notification = this.$inject('notification');
      notification.info = sinon.spy();
      notification.warn = sinon.spy();
      this.handle({type: 'flash', resource: {message: 'OK', type: 'info'}});
      this.handle({type: 'flash', resource: {message: 'FAIL', type: 'error'}});
      sinon.assert.calledOnce(notification.info.withArgs('OK'));
      sinon.assert.calledOnce(notification.warn.withArgs('FAIL'));
    });

    it('changes URL when triggered', function () {
      var url = this.$inject('$location').url = sinon.spy();
      this.handle({action: 'navigate', type: 'location', path: 'blah/blah'});
      sinon.assert.calledOnce(url.withArgs('blah/blah'));
    });

    it('changes state when navigating', function () {
      var change = this.$inject('TheAccountView').silentlyChangeState = sinon.spy();
      this.handle({action: 'update', type: 'location', path: 'account/blah/blah'});
      sinon.assert.calledOnce(change.withArgs('blah/blah'));
    });

    it('updates token if present', function () {
      var token = {super: 'token'};
      var update = this.$inject('authentication').updateTokenLookup = sinon.spy();
      this.handle({token: token});
      sinon.assert.calledOnce(update.withArgs(token));
    });

    it('refreshes token for any other message', function () {
      var refresh = this.$inject('tokenStore').refresh = sinon.spy();
      this.handle({blah: 'blah'});
      sinon.assert.calledOnce(refresh);
    });
  });
});
