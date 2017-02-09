'use strict';

describe('Gatekeeper Message Handler', function () {
  beforeEach(function () {
    this.window = {location: ''};
    module('contentful/test', ($provide) => {
      $provide.value('$window', this.window);
    });
    this.handle = this.$inject('handleGatekeeperMessage');
    this.mockService('Config', {
      websiteUrl: function (path) {
        return 'website/' + path;
      }
    });
  });

  describe('actions on message', function () {
    it('logs out cancelled user and redirects them', function () {
      this.handle({action: 'create', type: 'UserCancellation'});
      expect(this.window.location).toBe('website/goodbye');
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

    it('changes state when navigating', function () {
      const change = this.$inject('TheAccountView').silentlyChangeState = sinon.spy();
      this.handle({action: 'update', type: 'location', path: 'account/blah/blah'});
      sinon.assert.calledOnce(change.withArgs('blah/blah'));
    });

    it('refreshes token for any other message', function () {
      const refresh = this.$inject('tokenStore').refresh = sinon.spy();
      this.handle({blah: 'blah'});
      sinon.assert.calledOnce(refresh);
    });
  });
});
